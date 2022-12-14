import { TxnBuilderTypes, BCS } from 'aptos'
import {
  TxPayloadCallFunction,
  AptosResourceType,
  AptosCoinInfoResource,
  AptosPoolResource,
  AptosResource,
  CoinInfoAddress,
} from '../types/aptos'
import { SDK } from '../sdk'
import { IModule } from '../interfaces/IModule'
import { composeType, isSortedSymbols, extractAddressFromType } from '../utils/contracts'
import { getCoinOutWithFees, getCoinInWithFees, withSlippage } from '../math/swap'
import { BigNumber } from '../types'
import { CachedContent } from '../utils/cachedContent'
import { d } from '../utils/numbers'

export const AMM_SWAP_MODULE = 'amm_swap'
export const POOL_STRUCT = 'Pool'

export type createTestTransferTxPayloadParams = {
  account: string
  value: number
}

export type CalculateRatesParams = {
  fromToken: AptosResourceType
  toToken: AptosResourceType
  amount: BigNumber
  feeDenominator: string
  feeNumerator: string
  interactiveToken: 'from' | 'to'
  direction: boolean
}

export type CalculatePriceImpactParams = {
  fromToken: AptosResourceType
  toToken: AptosResourceType
  fromAmount: BigNumber
  toAmount: BigNumber
  interactiveToken: 'from' | 'to'
}

export type CreateTXPayloadParams = {
  fromToken: AptosResourceType
  toToken: AptosResourceType
  fromAmount: BigNumber
  toAmount: BigNumber
  interactiveToken: 'from' | 'to'
  slippage: number
}

const cacheTime5min = 5 * 60 * 1000
function getFutureTime(interval: number) {
  return Date.parse(new Date().toString()) + interval
}

export class SwapModule implements IModule {
  protected _sdk: SDK

  private readonly _cache: Record<string, CachedContent> = {}

  constructor(sdk: SDK) {
    this._sdk = sdk
  }

  get sdk() {
    return this._sdk
  }

  private async fetchAccountResource<T>(
    accountAddress: AptosResourceType,
    resourceType: AptosResourceType,
    overdueTime = 0
  ): Promise<AptosResource<T> | null> {
    let cacheData = this._cache[accountAddress + resourceType]
    if (cacheData?.getCacheData()) {
      return cacheData.value as AptosResource<T>
    }

    const data = await this.sdk.Resources.fetchAccountResource<T>(accountAddress, resourceType)
    cacheData = new CachedContent(data, overdueTime)
    this._cache[accountAddress + resourceType] = cacheData
    return data
  }

  // this is test
  createTestTransferTransactionPayload(params: createTestTransferTxPayloadParams): TxPayloadCallFunction {
    const { modules } = this.sdk.sdkOptions.networkOptions
    const functionName = composeType(modules.Coin, 'transfer')
    return {
      arguments: [params.account, params.value],
      function: functionName,
      type: 'entry_function_payload',
      type_arguments: ['0x1::aptos_coin::AptosCoin'],
    }
  }

  async calculateRates(params: CalculateRatesParams): Promise<string> {
    const { modules } = this.sdk.sdkOptions.networkOptions

    const fromCoinInfo = await this.fetchAccountResource<AptosCoinInfoResource>(
      extractAddressFromType(params.fromToken),
      composeType(CoinInfoAddress, [params.fromToken]),
      getFutureTime(cacheTime5min)
    )

    const toCoinInfo = await this.fetchAccountResource<AptosCoinInfoResource>(
      extractAddressFromType(params.toToken),
      composeType(CoinInfoAddress, [params.toToken]),
      getFutureTime(cacheTime5min)
    )

    if (!fromCoinInfo) {
      throw new Error('To Coin not exists')
    }

    if (!toCoinInfo) {
      throw new Error('To Coin not exists')
    }

    // const isSorted = isSortedSymbols(fromCoinInfo.data.symbol, toCoinInfo.data.symbol)
    const isSorted = params.direction
    const [coinX, coinY] = isSorted ? [params.fromToken, params.toToken] : [params.toToken, params.fromToken]

    const liquidityPoolType = composeType(modules.LiquidswapDeployer, AMM_SWAP_MODULE, POOL_STRUCT, [coinX, coinY])

    const liquidityPoolResource = await this.sdk.Resources.fetchAccountResource<AptosPoolResource>(
      modules.LiquidswapDeployer,
      liquidityPoolType
    )

    if (!liquidityPoolResource) {
      throw new Error(`LiquidityPool (${liquidityPoolType}) not found`)
    }

    const coinXReserve = liquidityPoolResource.data.coin_a.value
    const coinYReserve = liquidityPoolResource.data.coin_b.value

    // eslint-disable-next-line no-nested-ternary
    const [reserveX, reserveY] = isSorted
      ? params.interactiveToken === 'from'
        ? [d(coinXReserve), d(coinYReserve)]
        : [d(coinYReserve), d(coinXReserve)]
      : params.interactiveToken === 'from'
      ? [d(coinYReserve), d(coinXReserve)]
      : [d(coinXReserve), d(coinYReserve)]

    const outputTokens =
      params.interactiveToken === 'from'
        ? getCoinOutWithFees(d(params.amount), reserveX, reserveY, params.feeDenominator, params.feeNumerator)
        : getCoinInWithFees(d(params.amount), reserveX, reserveY, params.feeDenominator, params.feeNumerator)

    return outputTokens.toString()
  }

  async calculatePriceImpact(params: CalculatePriceImpactParams): Promise<string> {
    const { modules } = this.sdk.sdkOptions.networkOptions

    const fromCoinInfo = await this.fetchAccountResource<AptosCoinInfoResource>(
      extractAddressFromType(params.fromToken),
      composeType(CoinInfoAddress, [params.fromToken]),
      getFutureTime(cacheTime5min)
    )

    const toCoinInfo = await this.fetchAccountResource<AptosCoinInfoResource>(
      extractAddressFromType(params.toToken),
      composeType(CoinInfoAddress, [params.toToken]),
      getFutureTime(cacheTime5min)
    )

    if (!fromCoinInfo) {
      throw new Error('To Coin not exists')
    }

    if (!toCoinInfo) {
      throw new Error('To Coin not exists')
    }

    const [coinX, coinY] = [params.fromToken, params.toToken]

    const liquidityPoolType = composeType(modules.LiquidswapDeployer, AMM_SWAP_MODULE, POOL_STRUCT, [coinX, coinY])

    const liquidityPoolResource = await this.sdk.Resources.fetchAccountResource<AptosPoolResource>(
      modules.LiquidswapDeployer,
      liquidityPoolType
    )

    if (!liquidityPoolResource) {
      throw new Error(`LiquidityPool (${liquidityPoolType}) not found`)
    }

    const coinXReserve = d(liquidityPoolResource.data.coin_a.value)
    const coinYReserve = d(liquidityPoolResource.data.coin_b.value)

    const price = coinYReserve.div(coinXReserve)
    const newCoinX = params.interactiveToken === 'from' ? coinXReserve.plus(params.fromAmount) : coinXReserve.minus(params.fromAmount)
    const newCoinY = params.interactiveToken === 'from' ? coinYReserve.minus(params.toAmount) : coinYReserve.plus(params.toAmount)
    const newPrice = newCoinY.div(newCoinX)

    const impact = d(price.minus(newPrice)).div(price).mul(100)
    return impact.toString()
  }

  createSwapTransactionPayload(
    params: CreateTXPayloadParams,
    needPackage = false
  ): TxnBuilderTypes.TransactionPayloadEntryFunction | TxPayloadCallFunction {
    if (params.slippage >= 1 || params.slippage <= 0) {
      throw new Error(`Invalid slippage (${params.slippage}) value`)
    }

    const { modules } = this.sdk.sdkOptions.networkOptions

    const functionName = composeType(
      `${modules.LiquidswapDeployer}::amm_script`,
      params.interactiveToken === 'from' ? 'swap_exact_coin_for_coin' : 'swap_coin_for_exact_coin'
    )

    // const fromAmount =
    // params.interactiveToken === 'from' ? params.fromAmount : withSlippage(d(params.fromAmount), d(params.slippage), 'minus')
    const { fromAmount } = params
    // const toAmount = params.interactiveToken === 'to' ? params.toAmount : withSlippage(d(params.toAmount), d(params.slippage), 'plus')
    const { toAmount } = params

    if (needPackage) {
      const typeArguments = [
        new TxnBuilderTypes.TypeTagStruct(TxnBuilderTypes.StructTag.fromString(params.fromToken)),
        new TxnBuilderTypes.TypeTagStruct(TxnBuilderTypes.StructTag.fromString(params.toToken)),
      ]
      const args = [BCS.bcsSerializeU128(Number(fromAmount.toString())), BCS.bcsSerializeU128(Number(toAmount.toString()))]

      return new TxnBuilderTypes.TransactionPayloadEntryFunction(
        TxnBuilderTypes.EntryFunction.natural(
          `${modules.LiquidswapDeployer}::amm_script`,
          params.interactiveToken === 'from' ? 'swap_exact_coin_for_coin' : 'swap_coin_for_exact_coin',
          typeArguments,
          args
        )
      )
    }

    const typeArguments = [params.fromToken, params.toToken]
    const args = [d(fromAmount).toString(), d(toAmount).toString()]
    return {
      type: 'entry_function_payload',
      function: functionName,
      type_arguments: typeArguments,
      arguments: args,
    }
  }
}

import { TxnBuilderTypes, BCS } from 'aptos'
import { d } from '../utils/numbers'
import {
  AptosCoinInfoResource,
  AptosPoolResource,
  AptosResource,
  AptosResourceType,
  BigNumber,
  CoinInfoAddress,
  TxPayloadCallFunction,
} from '../types/aptos'
import { SDK } from '../sdk'
import { IModule } from '../interfaces/IModule'
import { CachedContent } from '../utils/cachedContent'
import { composeType, extractAddressFromType, isSortedSymbols } from '../utils/contracts'
import { getCoinXYForLiquidity, getLiquidityAndCoinYByCoinX, withLiquiditySlippage } from '../math/LiquidityHelper'

// Params.
export const AMM_SWAP_MODULE = 'amm_swap'
export const POOL_STRUCT = 'Pool'
export const POOL_NO_LIQUIDITY = -1

export type GetLiquidityForCoinInParams = {
  coinX: AptosResourceType
  coinY: AptosResourceType
  amountX: BigNumber
  direction: boolean
}

export type AddLiquidityParams = {
  coinX: string
  coinY: AptosResourceType
  coinXAmount: BigNumber
  coinYAmount: BigNumber
  slippage: number
}

export type GetCoinXYAmountForLiquidityParams = {
  coinX: AptosResourceType
  coinY: AptosResourceType
  liquidity: BigNumber
  direction: boolean
}
export type RemoveLiquidityParams = {
  coinX: string
  coinY: AptosResourceType
  liquidity: BigNumber
  slippage: number
}

const cacheTime5min = 5 * 60 * 1000
function getFutureTime(interval: number) {
  return Date.parse(new Date().toString()) + interval
}

export class LiquidityModule implements IModule {
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

  /**
   * Calculate liquidity and coinY amount In the other direction
   * @param params
   * @returns
   */
  async getLiquidityAndCoinYByCoinX(params: GetLiquidityForCoinInParams) {
    const { modules } = this.sdk.sdkOptions.networkOptions

    const coinXInfo = await this.fetchAccountResource<AptosCoinInfoResource>(
      extractAddressFromType(params.coinX),
      composeType(CoinInfoAddress, [params.coinX]),
      getFutureTime(cacheTime5min)
    )

    const coinYInfo = await this.fetchAccountResource<AptosCoinInfoResource>(
      extractAddressFromType(params.coinY),
      composeType(CoinInfoAddress, [params.coinY]),
      getFutureTime(cacheTime5min)
    )

    if (!coinXInfo) {
      throw new Error("coinY doesn't exist")
    }

    if (!coinYInfo) {
      throw new Error("coinX doesn't exists")
    }

    // const isSorted = isSortedSymbols(coinXInfo.data.symbol, coinYInfo.data.symbol)
    const isSorted = params.direction
    const [coinX, coinY] = isSorted ? [params.coinX, params.coinY] : [params.coinY, params.coinX]

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

    const [reserveIn, reserveOut] = isSorted ? [d(coinXReserve), d(coinYReserve)] : [d(coinYReserve), d(coinXReserve)]

    const outputTokens = getLiquidityAndCoinYByCoinX(d(params.amountX), reserveIn, reserveOut)
    return outputTokens
  }

  /// Create add liquidity transaction payload.
  createAddLiquidityTransactionPayload(
    params: AddLiquidityParams,
    needPackage = false
  ): TxnBuilderTypes.TransactionPayloadEntryFunction | TxPayloadCallFunction {
    if (params.slippage >= 1 || params.slippage <= 0) {
      throw new Error(`Invalid slippage (${params.slippage}) value`)
    }

    const { modules } = this.sdk.sdkOptions.networkOptions

    const coinXAmount = d(params.coinXAmount)
    const coinYAmount = d(params.coinYAmount)
    const coinXAmountMin = withLiquiditySlippage(coinXAmount, d(params.slippage), 'minus')
    const coinYAmountMin = withLiquiditySlippage(coinYAmount, d(params.slippage), 'minus')

    if (needPackage) {
      const typeArguments = [
        new TxnBuilderTypes.TypeTagStruct(TxnBuilderTypes.StructTag.fromString(params.coinX)),
        new TxnBuilderTypes.TypeTagStruct(TxnBuilderTypes.StructTag.fromString(params.coinY)),
      ]
      const args = [
        BCS.bcsSerializeU128(Number(coinXAmount)),
        BCS.bcsSerializeU128(Number(coinYAmount)),
        BCS.bcsSerializeU128(Number(coinXAmountMin)),
        BCS.bcsSerializeU128(Number(coinYAmountMin)),
      ]

      return new TxnBuilderTypes.TransactionPayloadEntryFunction(
        TxnBuilderTypes.EntryFunction.natural(`${modules.LiquidswapDeployer}::amm_script`, 'add_liquidity', typeArguments, args)
      )
    }
    const functionName = composeType(`${modules.LiquidswapDeployer}::amm_script`, 'add_liquidity')
    const typeArguments = [params.coinX, params.coinY]
    const args = [d(coinXAmount).toString(), d(coinYAmount).toString(), d(coinXAmountMin).toString(), d(coinYAmountMin).toString()]
    return {
      type: 'entry_function_payload',
      function: functionName,
      type_arguments: typeArguments,
      arguments: args,
    }
  }

  /// Get how much coinXAmount coinYAmount of opposite `params.liquidity ` coin you need to remove.
  async getCoinXYForLiquidity(params: GetCoinXYAmountForLiquidityParams) {
    const { modules } = this.sdk.sdkOptions.networkOptions

    const coinXInfo = await this.fetchAccountResource<AptosCoinInfoResource>(
      extractAddressFromType(params.coinX),
      composeType(CoinInfoAddress, [params.coinX]),
      getFutureTime(cacheTime5min)
    )

    const coinYInfo = await this.fetchAccountResource<AptosCoinInfoResource>(
      extractAddressFromType(params.coinY),
      composeType(CoinInfoAddress, [params.coinY]),
      getFutureTime(cacheTime5min)
    )

    if (!coinXInfo) {
      throw new Error("coinX doesn't exist")
    }

    if (!coinYInfo) {
      throw new Error("coinY doesn't exists")
    }

    // const isSorted = isSortedSymbols(coinXInfo.data.symbol, coinYInfo.data.symbol)
    const isSorted = params.direction
    const [coinX, coinY] = isSorted ? [params.coinX, params.coinY] : [params.coinY, params.coinX]

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

    const [reserveIn, reserveOut] = isSorted ? [d(coinXReserve), d(coinYReserve)] : [d(coinYReserve), d(coinXReserve)]

    return getCoinXYForLiquidity(d(params.liquidity), reserveIn, reserveOut)
  }

  /// Create  remove_liquidity transaction payload.
  async removeLiquidityTransactionPayload(
    params: RemoveLiquidityParams,
    needPackage = false
  ): Promise<TxnBuilderTypes.TransactionPayloadEntryFunction | TxPayloadCallFunction> {
    if (params.slippage >= 1 || params.slippage <= 0) {
      throw new Error(`Invalid slippage (${params.slippage}) value`)
    }

    const { modules } = this.sdk.sdkOptions.networkOptions
    const { coinXAmount, coinYAmount } = await this.getCoinXYForLiquidity({
      coinX: params.coinX as unknown as string,
      coinY: params.coinY,
      liquidity: params.liquidity,
      direction: true,
    })

    const coinXAmountMin = withLiquiditySlippage(coinXAmount, d(params.slippage), 'minus')
    const coinYAmountMin = withLiquiditySlippage(coinYAmount, d(params.slippage), 'minus')

    if (needPackage) {
      const typeArguments = [
        new TxnBuilderTypes.TypeTagStruct(TxnBuilderTypes.StructTag.fromString(params.coinX)),
        new TxnBuilderTypes.TypeTagStruct(TxnBuilderTypes.StructTag.fromString(params.coinY)),
      ]

      const args = [
        BCS.bcsSerializeU128(Number(params.liquidity)),
        BCS.bcsSerializeU128(Number(coinXAmountMin)),
        BCS.bcsSerializeU128(Number(coinYAmountMin)),
      ]

      return new TxnBuilderTypes.TransactionPayloadEntryFunction(
        TxnBuilderTypes.EntryFunction.natural(`${modules.LiquidswapDeployer}::amm_script`, 'remove_liquidity', typeArguments, args)
      )
    }
    const functionName = composeType(`${modules.LiquidswapDeployer}::amm_script`, 'remove_liquidity')
    const typeArguments = [params.coinX, params.coinY]
    const args = [d(params.liquidity).toString(), d(coinXAmountMin).toString(), d(coinYAmountMin).toString()]
    return {
      type: 'entry_function_payload',
      function: functionName,
      type_arguments: typeArguments,
      arguments: args,
    }
  }
}

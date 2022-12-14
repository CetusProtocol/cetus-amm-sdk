import { HexString, TxnBuilderTypes, TypeTagParser } from 'aptos'
import { composePoolLiquidityCoin, composeType, composeTypeByTypeTagStruct } from '../utils/contracts'
import { logCat } from '../utils/commom'
import { isAxiosError } from '../utils/is'
import {
  AptosCoinInfoResource,
  AptosCoinStoreResource,
  AptosResource,
  AptosResourceType,
  CoinInfoAddress,
  CoinStoreAddress,
  PoolLiquidityCoinType,
} from '../types/aptos'
import { SDK } from '../sdk'
import { IModule } from '../interfaces/IModule'

export type LpToken =
  | {
      coinA: AptosResourceType
      coinB: AptosResourceType
      lpAddress: AptosResourceType
    } & AptosCoinInfoResource

export type CoinStore =
  | {
      coinAddress: AptosResourceType
    } & AptosCoinStoreResource

export type CoinInfo =
  | {
      coinAddress: AptosResourceType
    } & AptosCoinInfoResource

function composeCoinAddress(type: string) {
  let coinAddress = ''
  const coinComplex = new TypeTagParser(type).parseTypeTag() as TxnBuilderTypes.TypeTagStruct
  const typeArgs = coinComplex.value.type_args
  if (typeArgs.length > 0) {
    const typeTag = typeArgs[0] as TxnBuilderTypes.TypeTagStruct
    if (typeTag.value.name.value === PoolLiquidityCoinType) {
      coinAddress = composePoolLiquidityCoin(typeTag).lpAddress
    } else {
      coinAddress = composeType(
        HexString.fromUint8Array(typeTag.value.address.address).toShortString(),
        typeTag.value.module_name.value,
        typeTag.value.name.value,
        []
      )
    }
  }
  return coinAddress
}

export class ResourcesModule implements IModule {
  protected _sdk: SDK

  constructor(sdk: SDK) {
    this._sdk = sdk
  }

  get sdk() {
    return this._sdk
  }

  async getCoinInfos(accountAddress: string): Promise<CoinInfo[]> {
    const resources = await this.fetchAccountResources<AptosCoinInfoResource>(accountAddress)
    const coinInfoArray: CoinInfo[] = []
    resources?.forEach((r) => {
      if (r.type.startsWith(CoinInfoAddress)) {
        const coinAddress = composeCoinAddress(r.type)
        if (coinAddress.length > 0) {
          coinInfoArray.push({
            coinAddress,
            ...r.data,
          })
        }
      }
    })
    return coinInfoArray
  }

  async getCoinStores(accountAddress: string): Promise<CoinStore[]> {
    const resources = await this.fetchAccountResources<AptosCoinStoreResource>(accountAddress)
    const coinStoreArray: CoinStore[] = []
    resources?.forEach((r) => {
      if (r.type.startsWith(CoinStoreAddress)) {
        const coinAddress = composeCoinAddress(r.type)
        if (coinAddress.length > 0) {
          coinStoreArray.push({
            coinAddress,
            ...r.data,
          })
        }
      }
    })
    return coinStoreArray
  }

  async getPoolLiquidityCoins(contarctAddress: string): Promise<LpToken[]> {
    const resources = await this.fetchAccountResources<AptosCoinInfoResource>(contarctAddress)
    const lpTokenArray: LpToken[] = []
    console.log('getPoolLiquidityCoins####resources###', resources)
    resources?.forEach((r) => {
      if (r.type.startsWith(CoinInfoAddress)) {
        const coinComplex = new TypeTagParser(r.type).parseTypeTag() as TxnBuilderTypes.TypeTagStruct
        const typeArgs = coinComplex.value.type_args
        if (typeArgs.length > 0) {
          const type = typeArgs[0] as TxnBuilderTypes.TypeTagStruct
          if (type.value.name.value === PoolLiquidityCoinType) {
            const lpToken: LpToken = {
              ...composePoolLiquidityCoin(type),
              ...r.data,
            }
            lpTokenArray.push(lpToken)
          }
        }
      }
    })
    return lpTokenArray
  }

  async fetchAccountResource<T = unknown>(accountAddress: string, resourceType: AptosResourceType): Promise<AptosResource<T> | null> {
    try {
      logCat('fetchAccountResource request:', {
        accountAddress,
        resourceType,
      })

      const response = await this._sdk.client.getAccountResource(accountAddress, resourceType)

      logCat('fetchAccountResource response:', response)

      return response as unknown as AptosResource<T>
    } catch (e: unknown) {
      if (isAxiosError(e)) {
        if (e.response?.status === 404) {
          return null
        }
      }

      throw e
    }
  }

  async fetchAccountResources<T = unknown>(accountAddress: string): Promise<AptosResource<T>[] | null> {
    try {
      logCat('fetchAccountResources request:', {
        accountAddress,
      })

      const response = await this._sdk.client.getAccountResources(accountAddress)

      // logCat('fetchAccountResources response:', response)

      return response as unknown as AptosResource<T>[]
    } catch (e: unknown) {
      if (isAxiosError(e)) {
        if (e.response?.status === 404) {
          return null
        }
      }

      throw e
    }
  }
}

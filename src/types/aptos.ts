import Decimal from '../utils/decimal'

export type AptosResourceType = string
export type BigNumber = Decimal.Value | number | string

export const CoinInfoAddress = '0x1::coin::CoinInfo'
export const CoinStoreAddress = '0x1::coin::CoinStore'
export const PoolLiquidityCoinType = 'PoolLiquidityCoin'

export type AptosResource<T = unknown> = {
  data: T
  type: string
}

export type AptosCoinInfoResource = {
  decimals: string
  name: string
  supply: {
    vec: [string]
  }
  symbol: string
}

export type AptosCoinStoreResource = {
  coin: {
    value: string
  }

  frozen: boolean
}

// not sure yet
export type AptosPoolResource = {
  coin_a: { value: string }
  coin_b: { value: string }
  protocol_fee_to: string
  locked_liquidity: {
    value: string
  }
  burn_capability: {
    dummy_field: boolean
  }
  mint_capability: {
    dummy_field: boolean
  }
}

export type TxPayloadCallFunction = {
  type: string
  function: string
  arguments: any[]
  type_arguments: any[]
}

export type TxPayloadInstallModule = {
  type: 'module_bundle_payload'
  modules: { bytecode: string }[]
}

export type AptosTxPayload = TxPayloadCallFunction | TxPayloadInstallModule

export type AptosCreateTx = {
  sender: string
  maxGasAmount: string
  gasUnitPrice: string
  gasCurrencyCode: string
  expiration: string
  payload: AptosTxPayload
}

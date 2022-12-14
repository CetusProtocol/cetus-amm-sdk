import { AptosClient } from 'aptos'
import { SwapModule } from './modules/swapModule'
import { LiquidityModule } from './modules/liquidityModule'
import { ResourcesModule } from './modules/resourcesModule'
import { AptosResourceType } from './types/aptos'

// not sure yet
export type SdkOptions = {
  rpcUrl: string
  networkOptions: {
    nativeToken: AptosResourceType
    modules: {
      LiquidswapDeployer: AptosResourceType
    } & Record<string, AptosResourceType>
  }
}
export class SDK {
  protected _client: AptosClient

  protected _swap: SwapModule

  protected _liquidity: LiquidityModule

  protected _resources: ResourcesModule

  protected _sdkOptions: SdkOptions

  constructor(options: SdkOptions) {
    this._sdkOptions = options
    this._client = new AptosClient(options.rpcUrl)
    this._swap = new SwapModule(this)
    this._liquidity = new LiquidityModule(this)
    this._resources = new ResourcesModule(this)
  }

  get client() {
    return this._client
  }

  get Swap() {
    return this._swap
  }

  get Liquidity() {
    return this._liquidity
  }

  get Resources() {
    return this._resources
  }

  get sdkOptions() {
    return this._sdkOptions
  }
}

import {AptosAccount, AptosAccountObject} from 'aptos'
import { SDK, SdkOptions } from "../src/sdk";
import { d, decimalsMultiplier } from "../src/utils/numbers";



const defaultNetworkOptions: SdkOptions = {
  rpcUrl: "https://fullnode.devnet.aptoslabs.com",
  networkOptions: {
    nativeToken: "0x1::aptos_coin::AptosCoin",
    modules: {
      LiquidswapDeployer : "0x1ce98d89494e9d3d7935bc3bd5fc714fc2abb99db3f024162552c4ba172f4d28"
    }
  }
};


export const TokensMapping: any = {
  APTOS: '0x1::aptos_coin::AptosCoin',
  BTC: '0x84dc9d921d277db5047dcb17addc2ecfbddfad087dd4ea825b2d17785755cb29::cetus_faucet::BTC',
  ETH: '0x84dc9d921d277db5047dcb17addc2ecfbddfad087dd4ea825b2d17785755cb29::cetus_faucet::ETH',
  USDC: '0x84dc9d921d277db5047dcb17addc2ecfbddfad087dd4ea825b2d17785755cb29::cetus_faucet::USDC',
  USDT: '0x84dc9d921d277db5047dcb17addc2ecfbddfad087dd4ea825b2d17785755cb29::cetus_faucet::USDT',
  BTC_ETH_LP: '0x1ce98d89494e9d3d7935bc3bd5fc714fc2abb99db3f024162552c4ba172f4d28::amm_swap::PoolLiquidityCoin<0x84dc9d921d277db5047dcb17addc2ecfbddfad087dd4ea825b2d17785755cb29::cetus_faucet::BTC, 0x84dc9d921d277db5047dcb17addc2ecfbddfad087dd4ea825b2d17785755cb29::cetus_faucet::ETH>',
  USDC_USDT_LP: '0x1ce98d89494e9d3d7935bc3bd5fc714fc2abb99db3f024162552c4ba172f4d28::amm_swap::PoolLiquidityCoin<0x84dc9d921d277db5047dcb17addc2ecfbddfad087dd4ea825b2d17785755cb29::cetus_faucet::USDC, 0x84dc9d921d277db5047dcb17addc2ecfbddfad087dd4ea825b2d17785755cb29::cetus_faucet::USDT>',
  ETH_USDC_LP: '0x1ce98d89494e9d3d7935bc3bd5fc714fc2abb99db3f024162552c4ba172f4d28::amm_swap::PoolLiquidityCoin<0x84dc9d921d277db5047dcb17addc2ecfbddfad087dd4ea825b2d17785755cb29::cetus_faucet::ETH, 0x84dc9d921d277db5047dcb17addc2ecfbddfad087dd4ea825b2d17785755cb29::cetus_faucet::USDC>',
  BTC_USDC_LP: '0x1ce98d89494e9d3d7935bc3bd5fc714fc2abb99db3f024162552c4ba172f4d28::amm_swap::PoolLiquidityCoin<0x84dc9d921d277db5047dcb17addc2ecfbddfad087dd4ea825b2d17785755cb29::cetus_faucet::BTC, 0x84dc9d921d277db5047dcb17addc2ecfbddfad087dd4ea825b2d17785755cb29::cetus_faucet::USDC>'
}

export const testAccountObject: AptosAccountObject = {
  address: '0xc5d45c706ab57e6e70523c6a19ec9d1ab235be95f3191361eaddff15415bf94f',
  publicKeyHex: '0xb5e259e28083136db0817268101f7fb22994fad47bd8a9381bacbdc856e7fba1',
  privateKeyHex: '0x1505081f584d4d81fea99f58743982beccc5b1e96c1e2013b0e7a19e30148cdd'
};


export function buildSdk() : SDK{
  return new SDK(defaultNetworkOptions)
}

export const CoinInfo: any = {
  ETH: { decimals: 8 },
  BTC: { decimals: 8 },
  USDT: { decimals: 6 },
  USDC: { decimals: 6 },
  USDC_USDT_LP: { decimals: 6 },
  ETH_USDC_LP: { decimals: 6 },
  BTC_USDC_LP: { decimals: 6 },
  
}

export function convertToDecimals(amount: number | string, token: string) {
  const mul = decimalsMultiplier(CoinInfo[token]?.decimals || 0);

  return d(amount).mul(mul)
}

function prettyAmount(amount: number | string, token: string) {
  const mul = decimalsMultiplier(CoinInfo[token]?.decimals || 0);

  return d(amount).div(mul)
}


export function buildTestAccount() : AptosAccount{
  return AptosAccount.fromAptosAccountObject(testAccountObject) ;
}

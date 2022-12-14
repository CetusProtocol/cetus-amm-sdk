import { AMM_SWAP_MODULE, POOL_STRUCT } from '../src/modules/liquidityModule'
import { AptosPoolResource } from '../src/types/aptos'
import { logCat } from '../src/utils/commom'
import { composeType } from '../src/utils/contracts'
import { buildSdk, buildTestAccount, TokensMapping } from './init_test_data'

describe('Pool Module', () => {
  const sdk = buildSdk()

  // test('createTestTransferTransactionPayload (to mode)', () => {
  //   const output = sdk.Swap.createTestTransferTransactionPayload({
  //     value: 717,
  //     account: '0x1c47bc3f432ef7cffc434f9e9c0dd9b6299dc742bf66931280c00e054be85aa8'
  //   })

  //   console.log('output###', output)
  //   expect(1).toBe(1)
  // })

  test('get_liquidityPoolResource', async () => {
    const { modules } = sdk.sdkOptions.networkOptions;
    const liquidityPoolType = composeType(modules.LiquidswapDeployer, AMM_SWAP_MODULE, POOL_STRUCT, [
      TokensMapping.USDC,
      TokensMapping.USDT,
    ]);
    const liquidityPoolResource = await sdk.Resources.fetchAccountResource<AptosPoolResource>(modules.LiquidswapDeployer, liquidityPoolType)

    logCat("get_liquidityPoolResource",liquidityPoolResource?.data)
  })


  // test('getPoolLiquidityCoins', async () => {
  //   const { modules } = sdk.sdkOptions.networkOptions;
  //   const lpTokenArray = await sdk.Resources.getPoolLiquidityCoins(modules.LiquidswapDeployer)

  //  logCat("getPoolLiquidityCoins",lpTokenArray)
  // })

  // test('getCoinStores', async () => {
  //   const coinStoreArray = await sdk.Resources.getCoinStores(buildTestAccount().address().hex())

  //  logCat("getCoinStores",coinStoreArray)
  // })
  // test('getCoinInfos', async () => {
  //   const { modules } = sdk.sdkOptions.networkOptions;
  //   const coinInfoArray = await sdk.Resources.getCoinInfos(modules.LiquidswapDeployer)

  //  logCat("getCoinInfos",coinInfoArray)
  // })


})

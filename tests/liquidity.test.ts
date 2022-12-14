import { AptosClient, TxnBuilderTypes, Types } from 'aptos'
import { logCat } from '../src/utils/commom'
import { buildSdk, buildTestAccount, convertToDecimals, TokensMapping } from './init_test_data'

describe('liquidity Module', () => {
  const sdk = buildSdk()

  test('getLiquidityAndCoinYByCoinX1', async () => {

    const output = await sdk.Liquidity.getLiquidityAndCoinYByCoinX({
      coinX: TokensMapping.ETH,
      coinY: TokensMapping.USDC,
      amountX: convertToDecimals('0.00000001', 'ETH'),
      direction: true
    })
    // getLiquidityAndCoinYByCoinX { coinYAmount: 14, lpAmount: 11.793816225244798459 }
    logCat("getLiquidityAndCoinYByCoinX",output)
  })

  // test('getLiquidityAndCoinYByCoinX2', async () => {

  //   const output = await sdk.Liquidity.getLiquidityAndCoinYByCoinX({
  //     coinX: TokensMapping.USDC,
  //     coinY: TokensMapping.USDT,
  //     amountX: convertToDecimals(14, TokensMapping.USDC),
  //     direction: true
  //   })
  //   //getLiquidityAndCoinYByCoinX { coinYAmount: 10, lpAmount: 11.793816225244798459 }
  //   logCat("getLiquidityAndCoinYByCoinX",output)
  // })

  // test('getCoinXYForLiquidity', async () => {

  //   const output = await sdk.Liquidity.getCoinXYForLiquidity({
  //     coinX: TokensMapping.USDC,
  //     coinY: TokensMapping.USDT,
  //     liquidity: 120,
  //     direction: true
  //   })

  //   logCat("getCoinXYForLiquidity",output)
  // })



  test('addLiquidity', async () => {
    // const { modules } = sdk.sdkOptions.networkOptions;

    // const account1 = buildTestAccount()
    // const amountX = convertToDecimals('0.001', 'ETH')
    // const amountY = (await sdk.Liquidity.getLiquidityAndCoinYByCoinX({
    //   coinX: TokensMapping.ETH,
    //   coinY: TokensMapping.USDC,
    //   amountX: amountX.toString(),
    //   direction: true,
    // })).coinYAmount

    // console.log('amountX###', amountX)
    // console.log('amountY###', amountY)

    // const addLiquidityPayload = sdk.Liquidity.createAddLiquidityTransactionPayload({
    //   coinX: TokensMapping.ETH,
    //   coinY: TokensMapping.USDC,
    //   coinXAmount:  amountX,
    //   coinYAmount: amountY,
    //   slippage: 0.05
    // },true) as TxnBuilderTypes.TransactionPayloadEntryFunction


    // const rawTxn = await sdk.client.generateRawTransaction(account1.address(), addLiquidityPayload);
    // const bcsTxn = AptosClient.generateBCSTransaction(account1, rawTxn);
    // const transactionRes = await sdk.client.submitSignedBCSTransaction(bcsTxn);
    // const respose =   await sdk.client.waitForTransactionWithResult(transactionRes.hash) as Types.UserTransaction;

    // logCat("amm_faucet",respose)
   },30*1000)

  test('removeLiquidityForLiquidityIn', async () => {
  //    const { modules } = sdk.sdkOptions.networkOptions;

  //    const account1 = buildTestAccount()

  //    const removeLiquidityPayload = await sdk.Liquidity.removeLiquidityTransactionPayload({
  //      coinX: TokensMapping.ETH,
  //      coinY: TokensMapping.BTC,
  //      liquidity:  111,
  //      slippage: 0.05
  //    },true) as TxnBuilderTypes.TransactionPayloadEntryFunction


  //    const rawTxn = await sdk.client.generateRawTransaction(account1.address(), removeLiquidityPayload);
  //    const bcsTxn = AptosClient.generateBCSTransaction(account1, rawTxn);
  //    const transactionRes = await sdk.client.submitSignedBCSTransaction(bcsTxn);
  //    const respose =   await sdk.client.waitForTransactionWithResult(transactionRes.hash) as Types.UserTransaction;

  //    logCat("removeLiquidity",respose)
   },30*1000)

})



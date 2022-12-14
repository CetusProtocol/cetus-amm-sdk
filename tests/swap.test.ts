import { AptosClient, TxnBuilderTypes, Types } from 'aptos'
// import { UserTransaction } from 'aptos/dist/generated/models/UserTransaction'
import { buildSdk, convertToDecimals, TokensMapping, CoinInfo, buildTestAccount } from './init_test_data'
import { d, decimalsMultiplier } from '../src/utils/numbers'
import { logCat } from '../src/utils/commom'

function prettyAmount(amount: number | string, token: string) {
  const mul = decimalsMultiplier(CoinInfo[token]?.decimals || 0)

  return d(amount).div(mul)
}

describe('Swap Module', () => {
  const sdk = buildSdk()

  // test ('calculatePriceImpact', async () => {
  //   const output = await sdk.Swap.calculatePriceImpact({
  //     fromToken: TokensMapping.USDC,
  //     toToken: TokensMapping.USDT,
  //     fromAmount: convertToDecimals('6.342137', 'USDC'),
  //     toAmount: convertToDecimals('1', 'USDT'),
  //     interactiveToken: 'to'
  //   })

  //   console.log(output)

  //   expect(1).toBe(1)
  // })

  // test('calculateRates (from mode)', async () => {
  //   const output = await sdk.Swap.calculateRates({
  //     fromToken: TokensMapping.ETH,
  //     toToken: TokensMapping.USDC,
  //     amount: convertToDecimals('0.00000001', 'ETH'),
  //     interactiveToken: 'from',
  //     feeDenominator: '1000',
  //     feeNumerator: '2',
  //     direction: true
  //   })

  //   console.log({
  //     amount: output,
  //     pretty: prettyAmount(output, 'ETH'),
  //   })

  //   expect(1).toBe(1)
  // })

  // test('calculateRates (to mode)', async () => {
  //   const output = await sdk.Swap.calculateRates({
  //     fromToken: TokensMapping.USDC,
  //     toToken: TokensMapping.USDT,
  //     amount: convertToDecimals('0.1', 'USDT'),
  //     interactiveToken: 'to',
  //     feeDenominator: '10000',
  //     feeNumerator: '1',
  //   })

  //   console.log({
  //     amount: output,
  //     pretty: prettyAmount(output, 'USDC')
  //   })

  //   expect(1).toBe(1)
  // })

  test('swap (from mode)', async () => {
    const account1 = buildTestAccount()
    const toAmount = await sdk.Swap.calculateRates({
      fromToken: TokensMapping.ETH,
      toToken: TokensMapping.USDC,
      amount: convertToDecimals('0.00001', 'ETH'),
      feeDenominator: '1000',
      feeNumerator: '2',
      interactiveToken: 'from',
      direction: true
    })
    console.log('toAmount####', toAmount)
    const swapPayload = sdk.Swap.createSwapTransactionPayload({
      fromToken: TokensMapping.ETH,
      toToken: TokensMapping.USDC,
      fromAmount: convertToDecimals('0.00001', 'ETH'),
      toAmount: toAmount,
      // toAmount: '0',
      // toAmount: d('377846'),
      interactiveToken: 'from',
      slippage: 0.003
    }, true) as TxnBuilderTypes.TransactionPayloadEntryFunction

    const rawTxn = await sdk.client.generateRawTransaction(account1.address(), swapPayload);
    const bcsTxn = AptosClient.generateBCSTransaction(account1, rawTxn);
    const transactionRes = await sdk.client.submitSignedBCSTransaction(bcsTxn);
    const respose =   await sdk.client.waitForTransactionWithResult(transactionRes.hash) as Types.UserTransaction;

    logCat("swap",respose)

    // console.log(result)
  })
})

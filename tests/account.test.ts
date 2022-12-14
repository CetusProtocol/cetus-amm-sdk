import { AptosClient, FaucetClient, TxnBuilderTypes, Types, AptosAccount, BCS } from 'aptos'
import { logCat } from '../src/utils/commom'
import { buildSdk, buildTestAccount } from './init_test_data'



describe('account test', () => {
  const sdk = buildSdk()

  test('createTestAccount', () => {
    // const account1 = new AptosAccount();
    // logCat("createTestAccount",account1.toPrivateKeyObject())
  })
  // // add test coin to account
  test('cetus_faucet', async () => {
    const { modules } = sdk.sdkOptions.networkOptions;
    const account1 = buildTestAccount()
    const faucetClient = new FaucetClient(sdk.sdkOptions.rpcUrl, "https://faucet.devnet.aptoslabs.com");
    const faucetRes = await faucetClient.fundAccount(account1.address(), 5000000000000);

    const entryFunctionPayload = new TxnBuilderTypes.TransactionPayloadEntryFunction(
      TxnBuilderTypes.EntryFunction.natural(
        "0x84dc9d921d277db5047dcb17addc2ecfbddfad087dd4ea825b2d17785755cb29::cetus_faucet",
        "faucet",
        [],
        [],
      ),
    );
    logCat("account1",account1)
    // const rawTxn = await sdk.client.generateRawTransaction(account1.address(), entryFunctionPayload, { maxGasAmount: BigInt(5000), gasUnitPrice: BigInt(100) });
    const rawTxn = await sdk.client.generateRawTransaction(account1.address(), entryFunctionPayload);
    console.log('rawTxn####', rawTxn)
    const bcsTxn = AptosClient.generateBCSTransaction(account1, rawTxn);
    const transactionRes = await sdk.client.submitSignedBCSTransaction(bcsTxn);
    const respose =   await sdk.client.waitForTransactionWithResult(transactionRes.hash) as Types.UserTransaction;

    logCat("cetus_faucet",respose)
  },30*1000)

})

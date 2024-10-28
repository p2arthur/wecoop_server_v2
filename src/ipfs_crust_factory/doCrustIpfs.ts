import algosdk from 'algosdk';
import axios from 'axios';
import * as algokit from '@algorandfoundation/algokit-utils';
import * as nacl from 'tweetnacl';
import { StorageOrderClient } from './onchain/clients/StorageOrderClient';
import { SendTransactionFrom } from '@algorandfoundation/algokit-utils/types/transaction';

const getAuthHeader = async (account: SendTransactionFrom) => {
  const sk = algosdk.seedFromMnemonic(process.env.WECOOP_CRUST_FACTORY_SECRET);

  console.log('sk', sk);
  const addr = process.env.WECOOP_CRUST_FACTORY_ADDRESS;
  const sk32 = sk.slice(0, 32);
  const signingKey = nacl.sign.keyPair.fromSeed(sk32);

  const signature = nacl.sign(Buffer.from(addr), signingKey.secretKey);
  const sigHex = Buffer.from(signature).toString('hex').slice(0, 128);

  const authStr = `sub-${account}:0x${sigHex}`;

  return Buffer.from(authStr).toString('base64');
};

export const uploadToIpfs = async (file: any) => {
  const account = process.env
    .WECOOP_CRUST_FACTORY_ADDRESS as unknown as SendTransactionFrom;
  const headers = { Authorization: `Basic ${await getAuthHeader(account)}` };

  const apiEndpoint = 'https://gw-seattle.crustcloud.io:443/api/v0/add';

  console.log('file data', file);

  const blob = new Blob([file.buffer]);

  const formData = new FormData();
  formData.append('file', blob, file.name);

  try {
    const { data } = await axios.post(apiEndpoint, formData, {
      headers: { ...headers },
    });

    const json: { Hash: string; Size: number } = data;
    return { cid: json.Hash, size: Number(json.Size) };

    console.log('cid');
  } catch (error) {
    console.error('Failed to upload to IPFS:', error);
    throw error;
  }
};

async function getPrice(
  algod: algosdk.Algodv2,
  appClient: StorageOrderClient,
  size: number,
  isPermanent: boolean = false,
) {
  const result = await (
    await appClient
      .compose()
      .getPrice({ size, is_permanent: isPermanent })
      .atc()
  ).simulate(algod);

  return result.methodResults[0].returnValue?.valueOf() as number;
}

async function getOrderNode(
  algod: algosdk.Algodv2,
  appClient: StorageOrderClient,
) {
  return (
    await (
      await appClient
        .compose()
        .getRandomOrderNode(
          {},
          { boxes: [new Uint8Array(Buffer.from('nodes'))] },
        )
        .atc()
    ).simulate(algod)
  ).methodResults[0].returnValue?.valueOf() as string;
}

async function placeOrder(
  algod: algosdk.Algodv2,
  appClient: StorageOrderClient,
  cid: string,
  size: number,
  price: number,
  isPermanent: boolean,
) {
  const merchant = await getOrderNode(algod, appClient);

  const addr = process.env.WECOOP_CRUST_FACTORY_ADDRESS;

  const seed = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: addr,
    receiver: (await appClient.appClient.getAppReference()).appAddress,
    amount: price,
    suggestedParams: await algod.getTransactionParams().do(),
  });

  await appClient.placeOrder({
    seed,
    cid,
    size,
    is_permanent: isPermanent,
    merchant,
  });
}

// Main function to be used on the frontend
export async function doCrustIpfs(
  network: 'testnet' | 'mainnet',
  algod: algosdk.Algodv2,
  file: File,
  cid: string,
  size: number,
) {
  algokit.Config.configure({ populateAppCallResources: true });

  const senderAddress: SendTransactionFrom = {
    addr: process.env.WECOOP_CRUST_FACTORY_ADDRESS,
  } as SendTransactionFrom;

  const appClient = new StorageOrderClient(
    {
      sender: senderAddress,
      resolveBy: 'id',
      id: network === 'testnet' ? 507867511 : 1275319623,
    },
    algod,
  );

  try {
    console.log('Uploading to IPFS...');

    console.log(`Uploaded to IPFS. CID: ${cid}, Size: ${size} bytes`);

    console.log('Getting price...');
    const price = await getPrice(algod, appClient, size);
    console.log(`Price for storage: ${price} microAlgos`);

    console.log('Placing order...');
    await placeOrder(algod, appClient, cid, size, price, false);
    console.log('Order placed successfully.');
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

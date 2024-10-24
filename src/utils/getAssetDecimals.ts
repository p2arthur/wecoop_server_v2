import { AlgodClient } from 'algosdk/dist/types/client/v2/algod';

export const getAssetDecimals = async (algod: AlgodClient, assetId: number) => {
try {
  console.log(assetId, 'assetId')
  const { params } = await algod.getAssetByID(assetId).do()

  const assetDecimals = params.decimals

  return assetDecimals
} catch (error) {
  console.error('Error to get asset decimals',error)
  return error
}
}

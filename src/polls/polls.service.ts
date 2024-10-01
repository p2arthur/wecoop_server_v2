import { Injectable } from '@nestjs/common';
import algosdk, { Algodv2, decodeUint64, encodeAddress } from 'algosdk';
import { PostInterface } from 'src/interfaces/PostInterface';
import { getRoundTimestamp } from 'src/utils/getRoundTimestamp';

@Injectable()
export class PollsService {
  constructor() {}

  private algodClient = new algosdk.Algodv2(
    process.env.ALGOD_TOKEN,
    process.env.ALGOD_SERVER,
    process.env.ALGOD_PORT,
  );

  async getAllPolls(): Promise<PostInterface[]> {
    const wecoopDaoAppId = 723107049;

    const boxesResponse = await this.algodClient
      .getApplicationBoxes(wecoopDaoAppId)
      .do();

    console.log('boxes response', boxesResponse);

    const allPolls: PostInterface[] = [];

    const decoder = new TextDecoder('utf-8');

    // Iterate through all boxes, retrieve their contents, and decode them
    for (const box of boxesResponse.boxes) {
      const boxNameBytes = box.name; // Uint8Array containing the box name
      let offset = 0;

      try {
        // Decode the box name (starts with 'poll_' prefix, followed by pollId as uint64)
        const prefixBytes = boxNameBytes.slice(offset, offset + 5);
        const prefix = decoder.decode(prefixBytes); // 'poll_'
        offset += 5;

        // Decode the pollId (next 8 bytes as uint64 big-endian)
        const pollIdBytes = boxNameBytes.slice(offset, offset + 8);
        const pollId = decodeUint64(pollIdBytes, 'bigint');
        offset += 8;

        // Get the box content (Uint8Array)
        const boxContentResponse = await this.algodClient
          .getApplicationBoxByName(wecoopDaoAppId, boxNameBytes)
          .do();

        console.log('box content response', boxContentResponse);

        const contentBytes = boxContentResponse.value; // Uint8Array of the box content
        offset = 0; // Reset offset for contentBytes

        // Decode the creator's address (32 bytes)
        const creatorAddressBytes = contentBytes.slice(offset, offset + 32);
        const creatorAddress = encodeAddress(creatorAddressBytes);
        offset += 32;

        // Decode the selected_asset (8 bytes as uint64)
        const selectedAssetBytes = contentBytes.slice(offset, offset + 8);
        const selectedAsset = decodeUint64(selectedAssetBytes, 'bigint');
        offset += 8;

        // Decode totalVotes (8 bytes as uint64)
        const totalVotesBytes = contentBytes.slice(offset, offset + 8);
        const totalVotes = decodeUint64(totalVotesBytes, 'bigint');
        offset += 8;

        // Decode yesVotes (8 bytes as uint64)
        const yesVotesBytes = contentBytes.slice(offset, offset + 8);
        const yesVotes = decodeUint64(yesVotesBytes, 'bigint');
        offset += 8;

        // Decode deposited (8 bytes as uint64)
        const depositedBytes = contentBytes.slice(offset, offset + 8);
        const deposited = decodeUint64(depositedBytes, 'bigint');
        offset += 8;

        // Decode the timestamp (8 bytes as uint64)
        const timestampBytes = contentBytes.slice(offset, offset + 8);
        const timestamp = decodeUint64(timestampBytes, 'bigint');
        offset += 8;

        // At this point, make sure the offset is aligned correctly for the question
        console.log('Offset after timestamp:', offset);

        // Decode the question (remaining bytes)
        const questionBytes = contentBytes.slice(offset + 4); // SKIP FIRST BYTE (assuming it’s a metadata byte)
        console.log('Raw question bytes:', questionBytes); // Log the raw bytes for the question
        const question = decoder.decode(questionBytes).trim();

        const timestampNumber = Number(timestamp);

        const trueTimestamp = await getRoundTimestamp(
          this.algodClient,
          timestampNumber,
        );

        console.log('trueTimestamp', trueTimestamp);

        // Construct the poll object
        const pollProperties = {
          boxName: `${prefix}${pollId}`,
          creatorAddress: creatorAddress,
          selectedAsset: selectedAsset.toString(),
          totalVotes: totalVotes.toString(),
          yesVotes: yesVotes.toString(),
          deposited: deposited.toString(),
          timestamp: trueTimestamp,
          question: question,
        };

        const poll: PostInterface = {
          text: question,
          timestamp: Number(trueTimestamp),
          creator_address: creatorAddress,
          status: 'accepted',
          assetId: Number(selectedAsset),
          depositedAmount: Number(deposited),
          type: 'poll',
        };

        allPolls.push(poll);
      } catch (error) {
        console.error(`Error decoding box:`, error);
      }
    }

    console.log('allPolls', allPolls);

    return allPolls;
  }
}

import { Injectable } from '@nestjs/common';
import algosdk, { Algodv2, decodeUint64, encodeAddress } from 'algosdk';
import { PrismaService } from 'src/infra/clients/prisma.service';
import { PollInterface, VoterInterface } from 'src/interfaces/PollInterface';
import { getRoundTimestamp } from 'src/utils/getRoundTimestamp';
import { Prisma } from '@prisma/client';
import { usableAssetsList } from 'src/data/usableAssetList';
import { ellipseAddress } from 'src/utils/ellipseAddress';

@Injectable()
export class PollsService {
  constructor(private prismaServices: PrismaService) {}

  private algodClient = new algosdk.Algodv2(
    process.env.ALGOD_TOKEN,
    process.env.ALGOD_SERVER,
    process.env.ALGOD_PORT,
  );

  async getPollsByVoterAddress(voterAddress: string) {
    return this.prismaServices.poll.aggregateRaw({
      pipeline: [
        {
          $lookup: {
            from: 'Voter',
            localField: 'pollId',
            foreignField: 'pollId',
            as: 'voters',
          },
        },
        {
          $match: {
            'voters.voterAddress': voterAddress,
          },
        },
      ],
    });
  }

  async getAllPolls(): Promise<PollInterface[]> {
    const wecoopDaoAppId = process.env.WECOOP_POLL_APP_ID;

    const boxesResponse = await this.algodClient
      .getApplicationBoxes(Number(wecoopDaoAppId))
      .do();

    const allPolls: PollInterface[] = [];

    const decoder = new TextDecoder('utf-8');

    // Retrieve all votes
    const allPollsVotes = await this.getAllVotes();

    // Iterate through all boxes, retrieve their contents, and decode them
    for (const box of boxesResponse.boxes) {
      const boxNameBytes = box.name; // Uint8Array containing the box name
      let offset = 0;

      try {
        // Decode the box name (starts with 'poll_' prefix, followed by pollId as uint64)
        const prefixBytes = boxNameBytes.slice(offset, 5);
        const prefix = decoder.decode(prefixBytes); // 'poll_'
        offset += 5;

        // Check for empty pollIdBytes before decoding
        const pollIdBytes = boxNameBytes.slice(offset, offset + 8);
        if (pollIdBytes.length !== 8) {
          console.error('Skipping empty or invalid pollIdBytes');
          continue; // Skip to next box if pollIdBytes length is invalid
        }
        const pollId = decodeUint64(pollIdBytes, 'bigint');
        offset += 8;

        // Filter votes for this pollId
        const pollVotes = allPollsVotes.filter(
          (vote) => vote.pollId === Number(pollId),
        );

        // Get the box content (Uint8Array)
        const boxContentResponse = await this.algodClient
          .getApplicationBoxByName(Number(wecoopDaoAppId), boxNameBytes)
          .do();

        const contentBytes = boxContentResponse.value;
        offset = 0; // Reset offset for contentBytes

        // Decode the creator's address (32 bytes)
        const creatorAddressBytes = contentBytes.slice(offset, offset + 32);
        if (creatorAddressBytes.length !== 32) {
          console.error('Skipping invalid creatorAddressBytes');
          continue;
        }
        const creatorAddress = encodeAddress(creatorAddressBytes);
        offset += 32;

        // Decode selected_asset (8 bytes as uint64)
        const selectedAssetBytes = contentBytes.slice(offset, offset + 8);
        if (selectedAssetBytes.length !== 8) {
          console.error('Skipping invalid selectedAssetBytes');
          continue;
        }
        const selectedAsset = decodeUint64(selectedAssetBytes, 'bigint');
        offset += 8;

        // Decode totalVotes (8 bytes as uint64)
        const totalVotesBytes = contentBytes.slice(offset, offset + 8);
        if (totalVotesBytes.length !== 8) {
          console.error('Skipping invalid totalVotesBytes');
          continue;
        }
        const totalVotes = decodeUint64(totalVotesBytes, 'bigint');
        offset += 8;

        // Decode yesVotes (8 bytes as uint64)
        const yesVotesBytes = contentBytes.slice(offset, offset + 8);
        if (yesVotesBytes.length !== 8) {
          console.error('Skipping invalid yesVotesBytes');
          continue;
        }
        const yesVotes = decodeUint64(yesVotesBytes, 'bigint');
        offset += 8;

        // Decode deposited (8 bytes as uint64)
        const depositedBytes = contentBytes.slice(offset, offset + 8);
        if (depositedBytes.length !== 8) {
          console.error('Skipping invalid depositedBytes');
          continue;
        }
        const deposited = decodeUint64(depositedBytes, 'bigint');
        offset += 8;

        // Decode the timestamp (8 bytes as uint64)
        const timestampBytes = contentBytes.slice(offset, offset + 8);
        if (timestampBytes.length !== 8) {
          console.error('Skipping invalid timestampBytes');
          continue;
        }
        const timestamp = decodeUint64(timestampBytes, 'bigint');
        offset += 8;

        // Decode expiry_timestamp (8 bytes as uint64)
        const expiryTimestampBytes = contentBytes.slice(offset, offset + 8);
        if (expiryTimestampBytes.length !== 8) {
          console.error('Skipping invalid expiryTimestampBytes');
          continue;
        }
        const expiryTimestamp = decodeUint64(expiryTimestampBytes, 'bigint');
        offset += 8;

        // **FIX** Extract country from the special characters and position (find the position of the 'CA')
        const specialBytes = contentBytes.slice(offset, offset + 8); // Find the part that has the 'CA'
        const specialString = decoder.decode(specialBytes);

        // Use a regex or manual method to extract 'CA' from the special characters
        const countryMatch = specialString.match(/[A-Z]{2}/); // Find two uppercase letters
        const country = countryMatch ? countryMatch[0] : ''; // Extract 'CA' or fallback to an empty string
        offset += 10;

        // **FIX** Decode the question (remaining bytes after country)
        const questionBytes = contentBytes.slice(offset); // Decode remaining bytes for the question
        const question = decoder.decode(questionBytes).trim();

        // Get the true timestamp using a helper function

        // Construct the poll object, including votes
        const poll: PollInterface = {
          text: question,
          pollId: Number(pollId),
          timestamp: Number(timestamp),
          creator_address: creatorAddress,
          status: 'accepted',
          assetId: Number(selectedAsset),
          depositedAmount: Number(deposited),
          totalVotes: Number(totalVotes),
          yesVotes: Number(yesVotes),
          expiry_timestamp: Number(expiryTimestamp), // Added expiry timestamp
          country: country, // Added country
          voters: pollVotes, // Append the filtered votes for this poll
        };

        allPolls.push(poll);
      } catch (error) {
        console.error(`Error decoding box:`, error);
      }
    }

    return allPolls;
  }

  async getAllVotes() {
    const wecoopDaoAppId = process.env.WECOOP_POLL_APP_ID;

    const boxesResponse = await this.algodClient
      .getApplicationBoxes(Number(wecoopDaoAppId))
      .do();

    const allVotes: VoterInterface[] = [];

    const decoder = new TextDecoder('utf-8');

    // Iterate through all boxes, retrieve their contents, and decode them
    for (const box of boxesResponse.boxes) {
      const boxNameBytes = box.name; // Uint8Array containing the box name
      let offset = 0;

      try {
        // Decode the box name (starts with 'poll_' prefix, followed by pollId)
        const prefixBytes = boxNameBytes.slice(offset, 5); // Assuming 'poll_' is 5 bytes
        const prefix = decoder.decode(prefixBytes); // 'poll_'

        // Decode pollId (next 8 bytes as uint64 big-endian)
        const pollIdBytes = boxNameBytes.slice(5, 13); // Poll ID starts after the 'poll_' prefix
        const pollId = new DataView(pollIdBytes.buffer).getBigUint64(0, false); // Read as uint64

        // Decode voter address (remaining 32 bytes)
        const voterBytes = boxNameBytes.slice(13); // The voter address is expected to be the remaining bytes (32 bytes)

        // Check if voterBytes length is 32 (Algorand address size)
        if (voterBytes.length !== 32) {
          console.error(
            `Skipping invalid voter address length: ${voterBytes.length}`,
          );
          continue;
        }

        const voterAddress = encodeAddress(voterBytes); // Decode as an Algorand address

        // Now retrieve and decode the box content (VoteInfo)
        const voteInfoBytes = await this.algodClient
          .getApplicationBoxByName(Number(wecoopDaoAppId), box.name)
          .do();

        const claimedBytes = voteInfoBytes.value.slice(7, 8); // First byte for claimed (0 or 1)

        const claimed = claimedBytes[0] ? true : false; // Since it's a single byte, just use the first byte

        // Store the vote info
        allVotes.push({
          pollId: Number(pollId),
          voterAddress,
          claimed,
          inFavor: true,
        });
      } catch (error) {
        console.error('Error decoding vote:', error);
      }
    }

    return allVotes;
  }

  async createVoter(data: Prisma.VoterUncheckedCreateInput) {
    const pollId = data.pollId;
    const result = await this.prismaServices.$transaction([
      this.prismaServices.poll.update({
        where: { pollId },
        data: {
          totalVotes: {
            increment: 1,
          },
          depositedAmount: { increment: data.deposited_amount },
          yesVotes: data.in_favor
            ? {
                increment: 1,
              }
            : undefined,
        },
      }),
      this.prismaServices.voter.create({
        data,
      }),
    ]);

    return this.prismaServices.voter.create({
      data,
    });
  }

  async claimVoter(voterAddress: string, pollId: number) {
    return this.prismaServices.voter.updateMany({
      where: {
        voterAddress,
        pollId,
      },
      data: { claimed: true },
    });
  }

  async getPollById(pollId: number) {
    return this.prismaServices.poll.findFirst({
      where: { pollId },
    });
  }

  async createPoll(poll: PollInterface) {
    return this.prismaServices.poll.create({
      data: {
        pollId: poll.pollId,
        creator_address: poll.creator_address,
        text: poll.text,
        timestamp: poll.timestamp,
        expiry_timestamp: poll.expiry_timestamp,
        country: poll.country,
        depositedAmount: poll.depositedAmount,
        assetId: poll.assetId,
        totalVotes: 0,
        yesVotes: 0,
        status: 'accepted',
      },
    });
  }

  async writePollTweetMessage(pollId: number, nfd: string, amount: number) {
    const poll = await this.prismaServices.poll.findFirst({
      where: { pollId: pollId },
    });

    return `🚀 ${
      nfd === '' ? ellipseAddress(poll.creator_address) : nfd
    } just launched a new WeCoop poll! 
    
Prize: ${amount} $${usableAssetsList
      .find((usableAsset) => usableAsset.assetId === poll.assetId)
      .name.toUpperCase()} 💰

🗳️ Join the vote now at wecoop.xyz

Powered by $ALGO`;
  }
}

export interface PollInterface {
  text: string;
  creator_address: string;
  pollId: number;
  timestamp: number | null;

  nfd?: string;
  status: 'accepted' | 'loading' | 'rejected' | string | null;
  assetId: number | null;
  depositedAmount: number;
  totalVotes: number;
  yesVotes: number;
  voters: VoterInterface[];
  country: string;
  expiry_timestamp: number;
}

export interface VoterInterface {
  pollId: number;
  voterAddress: string;
  claimed: boolean;
}

export interface PollInterface {
  text: string;
  creator_address: string;
  pollId: number;
  timestamp: number | null;
  country: string;
  nfd?: string;
  status: 'accepted' | 'loading' | 'rejected' | string | null;
  assetId: number | null;
  depositedAmount: number;
  totalVotes: number;
  yesVotes: number;
}

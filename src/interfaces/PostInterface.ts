export interface PostInterface {
  text: string;
  creator_address: string;
  transaction_id: string;
  timestamp: number | null;
  country: string;
  nfd?: string;
  likes: PostInterface[];
  replies: PostInterface[];
  status: 'accepted' | 'loading' | 'rejected' | null;
  assetId: number;
  isPersonalized: boolean;
}

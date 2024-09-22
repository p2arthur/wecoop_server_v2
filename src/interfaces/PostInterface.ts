export interface PostInterface {
  text: string;
  creator_address: string;
  transaction_id: string | null;
  timestamp: number | null;
  country: string | null;
  likes: [{creator_address: string}];
  replies: PostInterface[] | [];
  status: 'accepted' | null;
  assetId: number;
  isTopPost?: boolean;
}

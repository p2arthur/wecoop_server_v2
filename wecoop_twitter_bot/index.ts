import { clientWithUserAuth } from './twitterClient';

export const tweet = async (message: string) => {
  try {
    console.log('making tweet', message);

    await clientWithUserAuth.v2.tweet(message);
  } catch (error) {
    throw new Error('Error tweeeting');
  }
};

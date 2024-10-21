import { clientWithUserAuth } from './twitterClient';

export const tweetWithImage = async (message: string, imagePath: string) => {
  try {
    console.log('Making tweet with image', message);

    // Upload the image to Twitter
    const mediaId = await clientWithUserAuth.v1.uploadMedia(imagePath);

    // Post the tweet with the image
    await clientWithUserAuth.v2.tweet(message, {
      media: { media_ids: [mediaId] },
    });
  } catch (error) {
    console.error('Error tweeting with image', error);
    throw new Error('Error tweeting with image');
  }
};

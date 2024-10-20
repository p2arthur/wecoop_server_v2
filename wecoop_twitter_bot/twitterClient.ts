import { TwitterApi } from "twitter-api-v2";

const { API_KEY, API_SECRET, ACCESS_TOKEN, ACCESS_SECRET, BEARER_TOKEN } =
  process.env;

if (!BEARER_TOKEN) {
  throw new Error("BEARER_TOKEN is not defined");
}

export const bearerClient = new TwitterApi(BEARER_TOKEN);

export const clientWithUserAuth = new TwitterApi({
  appKey: API_KEY!,
  appSecret: API_SECRET!,
  accessToken: ACCESS_TOKEN!,
  accessSecret: ACCESS_SECRET!,
});

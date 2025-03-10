import { OpenAI } from "openai";

const API_PROVIDER = process.env.API_PROVIDER || "ELYN";

export let apiKey: string | undefined,
  apiEndpoint: string | undefined,
  modelName: string;

if (API_PROVIDER === "ELYN") {
  apiKey = process.env.ELYN_API_KEY;
  apiEndpoint = process.env.ELYN_API_ENDPOINT;
  modelName = "elyn/4o-mini";

  if (!apiKey || !apiEndpoint) {
    throw new Error("Missing required environment variables for ELYN API");
  }
}

export const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: apiEndpoint,
});

// Server-side context utilities for Next.js
import { headers } from "next/headers";
import {
  createEzbotClient,
  Prediction,
  PredictionsParams,
  RequestMeta,
  extractUtmFromSearchParams,
} from "@ezbot-ai/javascript-sdk";

export interface ServerContext {
  predictions: Prediction[];
}

// Create a singleton client for server usage (inlined from server-predictions)
const client = createEzbotClient();

/**
 * Fetch predictions server-side using the SDK client
 */
export async function getServerPredictions(
  params: PredictionsParams,
  meta?: RequestMeta
): Promise<Array<Prediction>> {
  return client.getPredictions(params, meta);
}

/**
 * Get server-side context with predictions and UTM tracking from search params
 */
export async function getServerContext(
  projectId: number,
  searchParams: { [key: string]: string | string[] | undefined } = {},
  pageUrlPath: string = "/",
  additionalParams?: Partial<PredictionsParams>
): Promise<ServerContext> {
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "";
  const referer = headersList.get("referer") || "";
  const origin = referer ? new URL(referer).origin : undefined;
  
  // Extract UTM parameters from search params
  const utmParams = extractUtmFromSearchParams(searchParams);

  // Whitelist a few safe headers to forward
  const allowedHeaderNames = new Set([
    'accept',
    'accept-language',
    'x-forwarded-for',
    'x-forwarded-host',
    'x-forwarded-proto',
  ]);
  const forwardedHeaders: Record<string, string> = {};
  for (const [key, value] of headersList.entries()) {
    if (allowedHeaderNames.has(key)) forwardedHeaders[key] = value;
  }

  const predictions = await getServerPredictions(
    {
      projectId,
      pageUrlPath,
      userAgent,
      referrer: referer,
      ...utmParams,
      ...additionalParams,
    },
    {
      userAgent,
      referrer: referer,
      origin,
      headers: forwardedHeaders,
    }
  ).catch((error) => {
    console.error("Failed to fetch server predictions:", error);
    return [];
  });

  return {
    predictions,
  };
}

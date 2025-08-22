// Server-side context utilities for Next.js
import { headers } from "next/headers";
import { getServerPredictions, Prediction, PredictionsParams } from "./server-predictions";

export interface ServerContext {
  predictions: Prediction[];
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
  
  // Extract UTM parameters from search params
  const utmParams = {
    utmSource: Array.isArray(searchParams.utm_source) 
      ? searchParams.utm_source[0] 
      : searchParams.utm_source,
    utmMedium: Array.isArray(searchParams.utm_medium) 
      ? searchParams.utm_medium[0] 
      : searchParams.utm_medium,
    utmCampaign: Array.isArray(searchParams.utm_campaign) 
      ? searchParams.utm_campaign[0] 
      : searchParams.utm_campaign,
    utmContent: Array.isArray(searchParams.utm_content) 
      ? searchParams.utm_content[0] 
      : searchParams.utm_content,
    utmTerm: Array.isArray(searchParams.utm_term) 
      ? searchParams.utm_term[0] 
      : searchParams.utm_term,
  };

  const predictions = await getServerPredictions({
    projectId,
    pageUrlPath,
    userAgent,
    referrer: referer,
    ...utmParams,
    ...additionalParams,
  }).catch((error) => {
    console.error("Failed to fetch server predictions:", error);
    return [];
  });

  return {
    predictions,
  };
}

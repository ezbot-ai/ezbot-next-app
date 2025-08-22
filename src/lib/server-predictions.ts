// Server-side prediction functionality for Next.js
// Aligned with the original SDK implementation

import { Agent } from 'http';
import { Agent as HttpsAgent } from 'https';

export interface Prediction {
  key: string;
  type: string;
  version: string;
  value: string;
  config: {
    selector: string;
    action: string;
    attribute?: string;
  } | null;
}

export interface PredictionsResponse {
  holdback: boolean;
  predictions: Array<Prediction>;
}

export interface ServerPredictionsParams {
  projectId: number;
  sessionId?: string;
  userId?: string;
  pageUrlPath?: string;
  userAgent?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  domainSessionIdx?: number;
  tz?: string;
}

type RequiredPredictionsParams = {
  projectId: string;
  sessionId: string;
};

type OptionalPredictionsParams = {
  pageUrlPath?: string;
  domainSessionIdx?: number;
  utmContent?: string;
  utmMedium?: string;
  utmSource?: string;
  utmCampaign?: string;
  utmTerm?: string;
  referrer?: string;
  tz?: string;
  userAgent?: string;
  userId?: string;
};

type PredictionsParams = RequiredPredictionsParams & OptionalPredictionsParams;

// Connection pooling agents for improved performance
const httpAgent = new Agent({
  keepAlive: true,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 60000,
  freeSocketTimeout: 30000,
});

const httpsAgent = new HttpsAgent({
  keepAlive: true,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 60000,
  freeSocketTimeout: 30000,
});

/**
 * Build parameters for server-side predictions (aligned with original SDK)
 */
function buildServerParams(params: ServerPredictionsParams): PredictionsParams {
  const requiredParams: RequiredPredictionsParams = {
    projectId: params.projectId.toString(),
    sessionId: params.sessionId || generateSessionId(),
  };

  const optionalParams: OptionalPredictionsParams = {
    pageUrlPath: params.pageUrlPath || '/',
    utmContent: params.utmContent || 'unknown',
    utmMedium: params.utmMedium || 'unknown',
    utmSource: params.utmSource || 'unknown',
    utmCampaign: params.utmCampaign || 'unknown',
    utmTerm: params.utmTerm || 'unknown',
    referrer: params.referrer || 'unknown',
    tz: params.tz || Intl.DateTimeFormat().resolvedOptions().timeZone,
    ...(params.userAgent && { userAgent: params.userAgent }),
    ...(params.userId && { userId: params.userId }),
    ...(params.domainSessionIdx && { domainSessionIdx: params.domainSessionIdx }),
  };

  return { ...requiredParams, ...optionalParams };
}

/**
 * Build query parameters with proper type handling
 */
const buildQueryParams = (params: PredictionsParams): string => {
  return Object.entries(params)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join('&');
};

/**
 * Fetch predictions server-side without browser dependencies
 */
export async function getServerPredictions(
  params: ServerPredictionsParams
): Promise<Array<Prediction>> {
  const startTime = Date.now();
  const basePredictionsURL = `https://api.ezbot.ai/predict`;
  const builtParams = buildServerParams(params);
  const queryParams = buildQueryParams(builtParams);
  const predictionsURL = `${basePredictionsURL}?${queryParams}`;

  // Log the outgoing request
  console.log('[SERVER_PREDICTIONS] Making request:', {
    url: predictionsURL,
    params: builtParams,
    timestamp: new Date().toISOString(),
    projectId: params.projectId,
    sessionId: builtParams.sessionId,
  });

  try {
    // Use connection pooling agent based on protocol
    const agent = predictionsURL.startsWith('https://') ? httpsAgent : httpAgent;
    
    const response = await fetch(predictionsURL, {
      agent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'cross-site',
        'Origin': 'https://localhost:3000',
        'Referer': 'https://localhost:3000/',
      },
    });

    const responseTime = Date.now() - startTime;
    
    if (response.status !== 200) {
      console.error('[SERVER_PREDICTIONS] Request failed:', {
        status: response.status,
        statusText: response.statusText,
        url: predictionsURL,
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
      });
      throw new Error(`Failed to fetch predictions: Got a ${response.status} response`);
    }
    
    const responseJSON = (await response.json()) as PredictionsResponse;
    
    // Log successful response
    console.log('[SERVER_PREDICTIONS] Request successful:', {
      predictionsCount: responseJSON.predictions.length,
      holdback: responseJSON.holdback,
      responseTime: `${responseTime}ms`,
      url: predictionsURL,
      timestamp: new Date().toISOString(),
    });
    
    return responseJSON.predictions;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('[SERVER_PREDICTIONS] Request error:', {
      error: error instanceof Error ? error.message : String(error),
      url: predictionsURL,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return [];
  }
}

/**
 * Generate a simple session ID for server-side usage
 */
function generateSessionId(): string {
  return `ssr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Client-side initialization function (simplified)
 */
export function initEzbot(projectId: number, userId?: string) {
  if (typeof window === 'undefined') return;
  
  // This is a simplified version - in production you'd use the full SDK
  console.log(`Ezbot initialized for project ${projectId}`, { userId });
  
  // Store basic info on window for demo purposes
  (window as any).ezbot = {
    projectId,
    userId,
    initialized: true,
  };
}

// Server-side prediction functionality for Next.js
// Aligned with the original SDK implementation

import { Prediction, PredictionsResponse } from '@ezbot-ai/javascript-sdk';

// Re-export types for consistency
export type { Prediction, PredictionsResponse };

export interface PredictionsParams {
  projectId: number | string;
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

import { request } from 'http';
import { request as httpsRequest } from 'https';
import { Agent as HttpAgent } from 'http';
import { Agent as HttpsAgent } from 'https';
import { URL } from 'url';

// Dedicated HTTP agents for Ezbot API requests
const ezbotHttpAgent = new HttpAgent({
  keepAlive: true,
  maxSockets: 50,
  maxFreeSockets: 10,
});

const ezbotHttpsAgent = new HttpsAgent({
  keepAlive: true,
  maxSockets: 50,
  maxFreeSockets: 10,
});

// Clean up agents on process exit to prevent hanging
process.on('SIGTERM', () => {
  setImmediate(() => {
    ezbotHttpAgent.destroy();
    ezbotHttpsAgent.destroy();
  });
});

process.on('SIGINT', () => {
  setImmediate(() => {
    ezbotHttpAgent.destroy();
    ezbotHttpsAgent.destroy();
  });
});

process.on('beforeExit', () => {
  setImmediate(() => {
    ezbotHttpAgent.destroy();
    ezbotHttpsAgent.destroy();
  });
});

/**
 * Make HTTP/HTTPS request with proper protocol detection
 */
function makeRequest(url: string, userAgent?: string, referer?: string, origin?: string): Promise<{ status: number; statusText: string; json: () => Promise<any> }> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === 'https:';
    
    // Extract domain from referer for origin if not provided
    const defaultOrigin = referer ? new URL(referer).origin : 'http://localhost:3000';
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      agent: isHttps ? ezbotHttpsAgent : ezbotHttpAgent,
      headers: {
        'accept': '*/*',
        'accept-language': 'en-US,en;q=0.9',
        'origin': origin || defaultOrigin,
        'priority': 'u=1, i',
        'referer': referer || 'http://localhost:3000/',
        'sec-ch-ua': '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'cross-site',
        'user-agent': userAgent || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
      },
    };

    const requestFn = isHttps ? httpsRequest : request;
    const req = requestFn(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode || 0,
          statusText: res.statusMessage || '',
          json: async () => JSON.parse(data),
        });
      });
    });

    req.on('error', (error) => {
      console.error('Request error:', error.message);
      reject(error);
    });

    req.setTimeout(800, () => {
      req.destroy();
      reject(new Error('Request timeout - server may be unavailable'));
    });

    req.end();
  });
}

/**
 * Build query parameters directly from params with defaults and proper encoding
 */
function buildQueryParams(params: PredictionsParams): string {
  const processedParams = {
    projectId: typeof params.projectId === 'number' ? params.projectId.toString() : params.projectId,
    sessionId: params.sessionId || generateSessionId(),
    pageUrlPath: params.pageUrlPath || '/',
    domainSessionIdx: params.domainSessionIdx,
    utmContent: params.utmContent || 'unknown',
    utmMedium: params.utmMedium || 'unknown',
    utmSource: params.utmSource || 'unknown',
    utmCampaign: params.utmCampaign || 'unknown',
    utmTerm: params.utmTerm || 'unknown',
    referrer: params.referrer || 'unknown',
    tz: params.tz || Intl.DateTimeFormat().resolvedOptions().timeZone,
  };

  return Object.entries(processedParams)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join('&');
}

/**
 * Fetch predictions server-side without browser dependencies
 */
export async function getServerPredictions(
  params: PredictionsParams
): Promise<Array<Prediction>> {
  const startTime = Date.now();
  const basePredictionsURL = `http://localhost:8000/predict`;
  const queryParams = buildQueryParams(params);
  const predictionsURL = `${basePredictionsURL}?${queryParams}`;

  try {
    // Extract origin from referrer if available
    const origin = params.referrer ? new URL(params.referrer).origin : undefined;
    
    // Add Promise.race with timeout to prevent SSR blocking
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('SSR timeout - API unavailable')), 500);
    });
    
    const response = await Promise.race([
      makeRequest(predictionsURL, params.userAgent, params.referrer, origin),
      timeoutPromise
    ]);

    const responseTime = Date.now() - startTime;
    
    if (response.status !== 200) {
      throw new Error(`Failed to fetch predictions: Got a ${response.status} response`);
    }
    
    const responseJSON = (await response.json()) as PredictionsResponse;
    
    return responseJSON.predictions;
  } catch (error) {
    console.error('Server predictions failed:', error instanceof Error ? error.message : 'Unknown error');
    return [];
  }
}

/**
 * Generate a simple session ID for server-side usage
 */
function generateSessionId(): string {
  return `ssr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

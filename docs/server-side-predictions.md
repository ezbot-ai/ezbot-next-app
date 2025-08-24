# Server‑Side Predictions with Ezbot (Next.js)

This guide shows the minimum steps to fetch predictions on the server and render with Ezbot on the client, plus options to apply page changes.

- Example files cited in this repo:
  - [`src/lib/server-context.ts`](https://github.com/ezbot-ai/ezbot-next-app/blob/main/src/lib/server-context.ts) (server-side fetch)
  - [`src/app/page.tsx`](https://github.com/ezbot-ai/ezbot-next-app/blob/main/src/app/page.tsx) (SSR + client hydration)

## Overview

- Predictions are application‑level.
- Fetch predictions server‑side (SSR/edge) using the SDK.
- Critically: initialize client‑side tracking at the application level with the exact same predictions so all events carry the same prediction context.

## TL;DR (Minimum Steps)

1. Install the SDK.
2. On the server, fetch predictions for the incoming request.
3. Pass those predictions into your top‑level client initializer.
4. Render page content using those predictions.

## 1) Install

```bash
npm install @ezbot-ai/javascript-sdk
```

## 2) Fetch predictions server‑side

Create a small helper that:
- Reads request metadata (headers, referrer, user agent).
- Extracts UTM parameters from Next’s `searchParams`.
- Calls the SDK to get predictions.

Example: [`src/lib/server-context.ts`](https://github.com/ezbot-ai/ezbot-next-app/blob/main/src/lib/server-context.ts)

```ts
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

// Reuse a singleton client on the server
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
    "accept",
    "accept-language",
    "x-forwarded-for",
    "x-forwarded-host",
    "x-forwarded-proto",
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

  return { predictions };
}
```

Notes:
- Pass `pageUrlPath`, `userAgent`, `referrer`, and UTM params so models have full context.
- Use a controlled header allowlist when forwarding.

## 3) Initialize client‑side tracking with the same predictions

This is critical. At the application level (e.g., a top‑level page or provider), pass the exact predictions from SSR into your client initializer so client events include the same prediction context.

Example: [`src/app/page.tsx`](https://github.com/ezbot-ai/ezbot-next-app/blob/main/src/app/page.tsx)

```tsx
import Image from "next/image";
import { getServerContext } from "../lib/server-context";
import { ClientOnlyEzbot, DynamicContent } from "../components/ClientOnlyEzbot";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;

  let serverContext;
  try {
    /**
     * CRITICAL: Server-side predictions fetch
     * Also initialize client-side tracking below with THESE SAME predictions.
     */
    serverContext = await getServerContext(4, resolvedSearchParams, "/");
  } catch (error) {
    console.error("Failed to get server context:", error);
    serverContext = { predictions: [] };
  }

  return (
    /**
     * CRITICAL: Initialize client-side tracker at the app level with
     * the EXACT predictions computed on the server.
     */
    <ClientOnlyEzbot projectId={4} predictions={serverContext.predictions}>
      {/* Your app content */}
      <main>
        {/* ... */}
      </main>
    </ClientOnlyEzbot>
  );
}
```

Why this matters:
- Predictions are application‑level.
- Client‑side tracking runs in the browser after hydration.
- Passing SSR predictions here ensures all client events are tagged with the correct prediction context.

## 4) Render page changes

You have a couple of options to apply changes based on predictions.

- **Component‑first approach (recommended for React apps):**
  - Use your own components wired to predictions to render text, attributes, or styles.
  - Example `DynamicContent` style component:

```tsx
<DynamicContent
  predictions={serverContext.predictions}
  selector=".row #hero-headline"
  className="text-4xl font-bold mb-6"
  id="hero-headline"
>
  Transform Your Business with AI
</DynamicContent>
```

- **Direct DOM/selector‑based changes:**
  - If your SDK or utilities expose selector/action helpers, you can target nodes and apply actions like `setText`, `setAttribute`, add/remove classes, etc.
  - Ensure these changes run consistently with your hydration model to avoid flicker.

**Best practices:**
- Keep mapping from prediction keys to UI locations centralized.
- Prefer declarative rendering for SSR consistency.
- Guard against missing predictions by providing sensible defaults.

## Advanced Options

- **Custom request parameters:**
  - `PredictionsParams`: `projectId`, `pageUrlPath`, `userAgent`, `referrer`, plus UTM fields.
  - Use `additionalParams` to override/add any supported inputs.

- **Error handling and resilience:**
  - On failures or timeouts, default to `[]` predictions and render the page.
  - Log errors server‑side; do not block the render pipeline.

- **Header forwarding:**
  - Only forward trusted headers (see allowlist).
  - Forwarding can improve relevance while keeping requests safe.

- **Cross‑domain and user IDs:**
  - If you use cross‑domain tracking or explicit user IDs, ensure the client tracker config matches your server assumptions so events unify correctly.

## Types and Interfaces (from the SDK)

- `Prediction`:
  - `{ key: string; type: string; version: string; value: string; config: VariableConfig | null }`
- `PredictionsParams`:
  - Input to `getPredictions(...)` describing project and request context.
- `RequestMeta`:
  - Optional request metadata for the server call (`userAgent`, `referrer`, `origin`, `headers`).

## Full Example (Putting It Together)

- Server helper: [`src/lib/server-context.ts`](https://github.com/ezbot-ai/ezbot-next-app/blob/main/src/lib/server-context.ts) as above
- Page usage: [`src/app/page.tsx`](https://github.com/ezbot-ai/ezbot-next-app/blob/main/src/app/page.tsx) as above
- App render:
  - Pass `serverContext.predictions` straight into your top‑level client initializer.
  - Use your components/utilities to apply changes.

## Troubleshooting

- **No predictions on client:**
  - Ensure `<ClientOnlyEzbot predictions={serverContext.predictions}>` is present at the application level.
- **Flicker or mismatched content:**
  - Keep SSR and client rendering aligned. Use the same predictions on both.
- **Network/timeout issues:**
  - Default to `[]` predictions and proceed. Log errors for analysis.
- **UTM not respected:**
  - Confirm you pass `searchParams` to your server helper and use `extractUtmFromSearchParams`.

---

If you’d like, I can also link this page from `README.md` and add it to any docs navigation you maintain.

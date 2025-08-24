# Ezbot Next.js Server-Side Rendering Example

This is a Next.js project that demonstrates how to use Ezbot predictions with server-side rendering (SSR). It shows how to fetch predictions on the server and apply visual changes before the page loads in the browser.

## Features

- **Server-side prediction fetching**: Predictions are fetched during SSR using the new `getServerPredictions` function
- **Server-side visual changes**: CSS and content changes are applied before the page loads
- **Client-side tracking**: Traditional Ezbot tracking is initialized after hydration
- **Dynamic content components**: React components that can be modified based on predictions
- **Debug information**: View the predictions that were fetched server-side

## Getting Started

### 1. Build the SDK

First, build the updated SDK with server-side functionality:

```bash
cd ../javascript-sdk
npm install
npm run build
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Architecture

### Server-Side Components

- **`getServerPredictions`**: Fetches predictions during SSR without browser dependencies
- **`ServerSideStyles`**: Generates CSS from visual predictions and injects it into the page
- **`DynamicContent`**: React component that can be modified based on predictions

### DynamicContent vs ServerSideStyles

- **`DynamicContent`**
  - Scope: Local to the rendered component instance.
  - Use when: You want to replace text/HTML, or add/remove classes for a specific element.
  - How it works: Looks up a prediction by `config.selector` and adjusts only that block.
  - SSR impact: Safe for SSR; returns a React node with applied changes.

- **`ServerSideStyles`**
  - Scope: Global CSS via a `<style>` tag injected on the page.
  - Use when: You want to hide/show elements, set styles, or add global CSS rules for one or many selectors.
  - How it works: Converts predictions into CSS rules and injects them. No DOM traversal required.
  - SSR impact: Ideal for applying visual changes before hydration.

### Client-Side Components

- **`EzbotProvider`**: Initializes client-side tracking after hydration
- Traditional Ezbot functionality remains available for client-side interactions

## Usage Examples

### Basic Server-Side Prediction Fetching

```typescript
import { getServerPredictions } from "@ezbot-ai/javascript-sdk";

export default async function Page() {
  const predictions = await getServerPredictions({
    projectId: 4,
    pageUrlPath: "/",
    userId: "user123", // optional
    userAgent: "...", // from headers
    referrer: "...", // from headers
  });

  return (
    <div>
      {/* Your content with server-side predictions applied */}
    </div>
  );
}
```

### Dynamic Content Component

```typescript
<DynamicContent 
  predictions={predictions} 
  selector=".hero-title"
  className="hero-title text-2xl font-bold"
>
  Default title text
</DynamicContent>
```

### Server-Side Styles

```typescript
<ServerSideStyles predictions={predictions} />
```

### Combined usage

Use both together when you need targeted content changes plus global visual adjustments:

```tsx
<>
  {/* Global visual changes (hide/show/setStyle/addGlobalCSS) */}
  <ServerSideStyles predictions={predictions} />

  {/* Targeted content/classes for a specific block */}
  <DynamicContent
    predictions={predictions}
    selector=".hero .title"
    className="title text-3xl font-bold"
  >
    Fallback Title
  </DynamicContent>
</>
```

## Supported Visual Changes

The server-side implementation supports the following visual changes:

- `setText`: Change text content
- `setInnerHTML`: Change HTML content
- `hide`/`show`: Control element visibility
- `setStyle`: Apply custom CSS properties
- `setFontSize`, `setFontColor`, `setBackgroundColor`: Style modifications
- `addClasses`/`removeClasses`: CSS class manipulation
- `setAttribute`: Set HTML attributes
- `addGlobalCSS`: Add global CSS rules

## Learn More

- [Ezbot JavaScript SDK](https://github.com/ezbot-ai/javascript-sdk)
- [Next.js Documentation](https://nextjs.org/docs)
- [Server-Side Rendering with Next.js](https://nextjs.org/docs/app/building-your-application/rendering/server-components)

## Using the SDK server client in Next.js

For most apps, use the provided `getServerContext()` in `src/lib/server-context.ts`, which wraps the SDK and manages headers and UTM extraction.

If you prefer to use the SDK directly, decide between a singleton client or a per-request client:

### Long-lived singleton (Node server)
```ts
// src/lib/ezbotClient.ts
import { createEzbotClient } from '@ezbot-ai/javascript-sdk';

export const ezbotClient = createEzbotClient({
  baseUrl: 'https://api.ezbot.ai',
  timeoutMs: 500,
});
// Do NOT call dispose() on each request; only at process shutdown if needed.
```

### Per-request (serverless)
```ts
import { createEzbotClient } from '@ezbot-ai/javascript-sdk';

export async function getPredictionsServerless(params, meta) {
  const client = createEzbotClient({ baseUrl: 'https://api.ezbot.ai', timeoutMs: 500 });
  try {
    return await client.getPredictions(params, meta);
  } finally {
    // Free sockets for serverless invocation
    client.dispose();
  }
}
```

The SDK gracefully returns an empty array on network errors/timeouts so SSR can proceed.

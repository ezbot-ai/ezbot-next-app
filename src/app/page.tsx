import Image from "next/image";
import { headers } from "next/headers";
import { getServerPredictions, Prediction } from "../lib/server-predictions";
import { EzbotProvider } from "../components/EzbotProvider";
import { ServerSideStyles } from "../components/ServerSideStyles";
import { DynamicContent } from "../components/DynamicContent";

export default async function Home() {
  // Get server-side predictions
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "";
  const referer = headersList.get("referer") || "";
  
  const predictions = await getServerPredictions({
    projectId: 4,
    pageUrlPath: "/",
    userAgent,
    referrer: referer,
    // You can also pass UTM parameters from URL search params
  }).catch((error) => {
    console.error("Failed to fetch server predictions:", error);
    return [];
  });

  return (
    <EzbotProvider projectId={11}>
      <ServerSideStyles predictions={predictions} />
      <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
        <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
          <Image
            className="dark:invert"
            src="/next.svg"
            alt="Next.js logo"
            width={180}
            height={38}
            priority
          />
          
          {/* Hero section with dynamic content */}
          <div className="row text-center">
            <DynamicContent 
              predictions={predictions} 
              selector=".row #hero-headline"
              className="text-4xl font-bold mb-6"
              id="hero-headline"
            >
              Transform Your Business with AI
            </DynamicContent>

            <div className="col-md-7 mx-auto">
              <DynamicContent 
                predictions={predictions} 
                selector=".row > .col-md-7 > p"
                className="text-xl text-gray-600 mb-8 max-w-2xl"
              >
                Discover how our platform helps businesses optimize their user experience through intelligent testing and personalization.
              </DynamicContent>
            </div>
          </div>

          <ol className="font-mono list-inside list-decimal text-sm/6 text-center sm:text-left">
            <li className="mb-2 tracking-[-.01em]">
              Server-side predictions are fetched during SSR
            </li>
            <li className="tracking-[-.01em]">
              Visual changes are applied before the page loads
            </li>
            <li className="tracking-[-.01em] mt-2">
              Client-side tracking is initialized after hydration
            </li>
          </ol>

          {/* Predictions debug info */}
          <div className="predictions-debug bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mt-8">
            <h3 className="font-semibold mb-2">Server-side Predictions Debug:</h3>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(predictions, null, 2)}
            </pre>
          </div>

          <div className="flex gap-4 items-center flex-col sm:flex-row">
            <DynamicContent 
              predictions={predictions} 
              selector="#hero-cta"
              className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
              id="hero-cta"
            >
              Get Started Today
            </DynamicContent>
            
            <a
              className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
              href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
            >
              Read our docs
            </a>
          </div>
        </main>
        <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
          <a
            className="flex items-center gap-2 hover:underline hover:underline-offset-4"
            href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              aria-hidden
              src="/file.svg"
              alt="File icon"
              width={16}
              height={16}
            />
            Learn
          </a>
          <a
            className="flex items-center gap-2 hover:underline hover:underline-offset-4"
            href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              aria-hidden
              src="/window.svg"
              alt="Window icon"
              width={16}
              height={16}
            />
            Examples
          </a>
          <a
            className="flex items-center gap-2 hover:underline hover:underline-offset-4"
            href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              aria-hidden
              src="/globe.svg"
              alt="Globe icon"
              width={16}
              height={16}
            />
            Go to nextjs.org →
          </a>
          </footer>
      </div>
    </EzbotProvider>
  );
}

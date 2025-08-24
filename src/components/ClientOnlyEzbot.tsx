'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import {initEzbotWithServerSidePredictions, startActivityTracking, trackPageView} from '@ezbot-ai/javascript-sdk';
import type { Prediction } from '@ezbot-ai/javascript-sdk';


// Dynamically import components that need predictions with no SSR
const ServerSideStyles = dynamic(
  () => import('./ServerSideStyles').then(mod => ({ default: mod.ServerSideStyles })),
  { ssr: false }
);

const DynamicContent = dynamic(
  () => import('./DynamicContent').then(mod => ({ default: mod.DynamicContent })),
  { ssr: false }
);

interface ClientOnlyEzbotProps {
  projectId: number;
  userId?: string;
  predictions: Prediction[];
  children: React.ReactNode;
}

export function ClientOnlyEzbot({ projectId, userId, predictions, children }: ClientOnlyEzbotProps) {
  useEffect(() => {
    try {
      if (predictions && predictions.length >= 0) {
        initEzbotWithServerSidePredictions(projectId, predictions, userId);
        
        startActivityTracking({
          minimumVisitLength: 5,
          heartbeatDelay: 10
        });
        trackPageView();
      }
    } catch (error) {
      console.error('Failed to initialize Ezbot SDK:', error);
    }
  }, [projectId, predictions, userId]);

  return (
    <>
      <ServerSideStyles predictions={predictions} />
      {children}
    </>
  );
}

// Export DynamicContent for use in the client-only context
export { DynamicContent };

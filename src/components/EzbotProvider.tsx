'use client';

import { useEffect } from 'react';
import { initEzbot } from '../lib/server-predictions';

interface EzbotProviderProps {
  projectId: number;
  userId?: string;
  children: React.ReactNode;
}

export function EzbotProvider({ projectId, userId, children }: EzbotProviderProps) {
  useEffect(() => {
    // Initialize client-side tracking after server-side rendering
    initEzbot(projectId, userId);
  }, [projectId, userId]);

  return <>{children}</>;
}

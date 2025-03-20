'use client';

import React from 'react';
import { AppInsightsContext } from '@microsoft/applicationinsights-react-js';
import { reactPlugin } from './ApplicationInsights';

export default function AppInsightsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppInsightsContext.Provider value={reactPlugin}>
      {children}
    </AppInsightsContext.Provider>
  );
}

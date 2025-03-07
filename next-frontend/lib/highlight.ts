// lib/highlight.js
import { H } from '@highlight-run/node';

if (!H.isInitialized()) {
  H.init({
    projectID: process.env.NEXT_PUBLIC_HIGHLIGHT_PROJECT_ID || '',
    serviceName: 'subtitle-nextjs-backend',
    environment: process.env.NODE_ENV || 'development',
  });
}

export { H };
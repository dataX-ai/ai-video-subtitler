import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers'
import metrics from '../../utils/metrics';


// Force this route to be processed on the server where metrics are available
export const runtime = 'nodejs';

const SECRET_DEV_KEY = process.env.SECRET_DEV_KEY

// Helper function to check if url is hosted on prod
function isProdUrl(request: NextRequest): boolean {
  const host = request.headers.get('host') || 'subtitiles.2vid.ai';
  return !host.includes('2vid.ai');
}

export async function GET(request: NextRequest) {
  try {
    const headersList = headers()
    const authHeader = headersList.get('x-dev-secret-key')

    // Check if the request is coming from localhost
    if (!isProdUrl(request) && (!authHeader || authHeader !== SECRET_DEV_KEY)) {
      // Return 404 for non-localhost requests to hide the endpoint
      return new NextResponse('Not Found', {
        status: 404,
      });
    }
    
    // Check if metrics are available in this environment
    if (!metrics.isMetricsAvailable()) {
      return new NextResponse('Metrics are not available in this environment', {
        status: 503, // Service Unavailable
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }

    const metricsOutput = await metrics.getMetrics();

    return new NextResponse(metricsOutput, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  } catch (error) {
    console.error('Error generating metrics:', error);
    return new NextResponse('Error generating metrics', {
      status: 500,
    });
  }
}

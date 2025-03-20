import { NextRequest, NextResponse } from 'next/server';
import metrics from '../../utils/metrics';

// Force this route to be processed on the server where metrics are available
export const runtime = 'nodejs';


export async function GET(request: NextRequest) {
  try {
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

    console.log('Metrics output:', metricsOutput);
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



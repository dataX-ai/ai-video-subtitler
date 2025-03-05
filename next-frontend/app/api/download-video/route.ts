import { NextRequest, NextResponse } from "next/server";
import { withAppRouterHighlight } from '@/app/utils/app-router-highlight.config'
import { H } from '@highlight-run/next/server'

export const POST = withAppRouterHighlight(async function POST(
  request: NextRequest,
) {
  const { span } = H.startWithHeaders('download-video-span', {})
  
  try {
    const { videoUrl } = await request.json();

    const response = await fetch(videoUrl, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch video');
    }

    const videoBlob = await response.blob();
    
    span.end()
    return new NextResponse(videoBlob, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': 'attachment; filename="subtitled-video.mp4"',
      },
    });
  } catch (error) {
    console.error('Error downloading video:', error);
    span.end()
    return NextResponse.json({ error: 'Failed to download video' }, { status: 500 });
  }
}) 

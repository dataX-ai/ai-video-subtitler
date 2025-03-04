import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { videoUrl } = await req.json();

    const response = await fetch(videoUrl, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch video');
    }

    const videoBlob = await response.blob();
    
    return new NextResponse(videoBlob, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': 'attachment; filename="subtitled-video.mp4"',
      },
    });
  } catch (error) {
    console.error('Error downloading video:', error);
    return NextResponse.json({ error: 'Failed to download video' }, { status: 500 });
  }
} 

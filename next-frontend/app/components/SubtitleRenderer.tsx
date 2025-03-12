import React, { useEffect, useRef, useState } from 'react';
import { TranscriptionSegment } from './VideoUpload';
import { generateAssContent, SubtitleStyle } from '../utils/subtitle-utils';
import SubtitlesOctopus from 'libass-wasm';

interface SubtitleRendererProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  segments: TranscriptionSegment[];
  subtitleStyle: SubtitleStyle;
  visible?: boolean;
}

/**
 * Component that renders ASS subtitles on a video using SubtitlesOctopus
 */
const SubtitleRenderer: React.FC<SubtitleRendererProps> = ({
  videoRef, 
  segments, 
  subtitleStyle,
  visible = true
}) => {
  const octopusRef = useRef<any>(null);
  const [assContent, setAssContent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Generate ASS content when inputs change
  useEffect(() => {
    if (!videoRef.current || segments.length === 0) return;
    
    const generateSubtitles = async () => {
      try {
        const video = videoRef.current;
        const videoWidth = video.videoWidth || 640;
        const videoHeight = video.videoHeight || 360;
        
        console.log(`Generating ASS for video dimensions: ${videoWidth}x${videoHeight}`);
        
        // Generate ASS content
        const content = await generateAssContent(
          segments,
          subtitleStyle,
          videoWidth,
          videoHeight
        );
        if (octopusRef.current) {
          octopusRef.current.setTrack(content);
        }
        else {setAssContent(content);}
        console.log("ASS subtitle content generated successfully", assContent);
      } catch (err) {
        console.error("Error generating ASS subtitle content:", err);
        setError("Failed to generate subtitle content");
      }
    };
    
    generateSubtitles();
  }, [segments, subtitleStyle, videoRef]);

  // Initialize or update SubtitlesOctopus when ASS content changes
  useEffect(() => {
    if (!assContent || !videoRef.current || !visible) return;
    
    // Function to initialize SubtitlesOctopus
    const initializeOctopus = () => {
      // Clean up existing instance if it exists
      if (octopusRef.current) {
        try {
          octopusRef.current.dispose();
        } catch (e) {
          console.error("Error disposing previous SubtitlesOctopus instance:", e);
        }
        octopusRef.current = null;
      }
      
      try {
        console.log("Initializing SubtitlesOctopus with direct content");
        
        // Create new instance - let the library create its own canvas
        octopusRef.current = new SubtitlesOctopus({
          video: videoRef.current,
          subContent: assContent,
          workerUrl: '/js/libass/subtitles-octopus-worker.js',
          legacyWorkerUrl: '/js/libass/subtitles-octopus-worker-legacy.js',
          fonts: ['/js/libass/NotoSans.ttf', '/js/libass/Roboto.ttf'],
          onReady: () => {
            console.log("SubtitlesOctopus initialized successfully");
            setIsInitialized(true);
          },
          onError: (err: any) => {
            console.error("SubtitlesOctopus error:", err);
            setError("Error rendering subtitles");
          },
          debug: true
        });
      } catch (err) {
        console.error("Error initializing SubtitlesOctopus:", err);
        setError("Failed to initialize subtitle renderer");
      }
    };
    
    if (videoRef.current && videoRef.current.readyState >= 0) {
      initializeOctopus();
    } else {
      // Wait for video metadata to load first
      const handleLoadedMetadata = () => {
        initializeOctopus();
        videoRef.current?.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
      videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      
      return () => {
        videoRef.current?.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
    
    // Cleanup function
    return () => {
      if (octopusRef.current) {
        try {
          octopusRef.current.dispose();
        } catch (e) {
          console.error("Error disposing SubtitlesOctopus:", e);
        }
        octopusRef.current = null;
      }
    };
  }, [assContent, videoRef, visible]);

  // If component is not visible, don't render anything
  if (!visible) {
    return null;
  }

  // If there's an error, show error message
  if (error) {
    return (
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-red-500/70 text-white px-3 py-1 rounded text-sm">
        {error}
      </div>
    );
  }

  // Since SubtitlesOctopus creates its own canvas, we don't need to render one
  // Just return a wrapper for the error message when debugging
  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
      {/* Debug info (can be removed in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs p-1 rounded">
          {isInitialized ? "Renderer active" : "Initializing..."}
        </div>
      )}
    </div>
  );
};

export default SubtitleRenderer;

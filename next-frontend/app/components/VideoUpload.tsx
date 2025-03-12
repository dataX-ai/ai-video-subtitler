"use client";

import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Slider } from "@/components/ui/slider"
import {
  faUpload,
  faSpinner,
  faCheck,
  faPalette,
  faFont,
  faGripLines,
  faTextHeight,
  faVideo,
  faTrash,
  faExchangeAlt,
  faSliders,
  faFileAlt,
  faMicrophone,
  faDownload,
  faPlay,
  faPause,
  faVolumeUp,
  faVolumeMute,
} from "@fortawesome/free-solid-svg-icons";
import React from "react";
import { ChromePicker, ColorResult } from "react-color";
import SubtitleCustomizer from "./SubtitleCustomizer";
import { SubtitleStyle, preprocessSegments, MAX_SEGMENT_LENGTH } from "../utils/subtitle-utils";
import SubtitleRenderer from "./SubtitleRenderer";

interface VideoUploadProps {
  initialVideoSrc?: string;
  initialVideoFile?: File;
  isPreselectedVideo?: boolean;
  onUpload: (
    file: File,
    setTranscription: (text: string) => void,
    setIsTranscribing: (value: boolean) => void,
    setAudioUrl: (url: string) => void,
    setUniqueId: (id: string) => void,
    setSegments: (segments: TranscriptionSegment[]) => void
  ) => void;
  onRemove?: () => void;
}

export type SubtitleColors = {
  line1: {
    text: string;
    background: string;
  };
};

export type SubtitleFont = "NotoSans" | "Arial" | "Roboto";
export type SubtitlePosition = { y: number };

export type TranscriptionSegment = {
  id: number;
  start: number;
  end: number;
  text: string;
};


const VideoUpload = ({
  initialVideoSrc,
  initialVideoFile,
  isPreselectedVideo = false,
  onUpload,
  onRemove,
}: VideoUploadProps) => {
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [transcription, setTranscription] = useState("");
  const [segments, setSegments] = useState<TranscriptionSegment[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [isGeneratingSubtitles, setIsGeneratingSubtitles] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [uniqueId, setUniqueId] = useState("");
  const [subtitledVideoUrl, setSubtitledVideoUrl] = useState<string | null>(
    null
  );
  const [subtitleColors, setSubtitleColors] = useState<SubtitleColors>({
    line1: {
      text: "#FFFFFF",
      background: "#A855F7",
    },
  });
  const [activeColorPicker, setActiveColorPicker] = useState<string | null>(
    null
  );
  const [subtitlePosition, setSubtitlePosition] = useState<SubtitlePosition>({ y: 3 });
  const [subtitleFont, setSubtitleFont] = useState<SubtitleFont>("Arial");
  const [subtitleSize, setSubtitleSize] = useState<number>(30);
  const [showTranscriptionModal, setShowTranscriptionModal] = useState(false);
  const textEditorRef = useRef<HTMLTextAreaElement>(null);
  const videoComponentRef = useRef<HTMLDivElement>(null);
  
  // Add new state for font size range
  const [fontSizeRange, setFontSizeRange] = useState({ min: 15, max: 64 });

  // Add new state for pre-selected videos
  const [videoSrc, setVideoSrc] = useState<string | null>(
    initialVideoSrc || null
  );

  // Add a ref for the video element
  const videoRef = useRef<HTMLVideoElement>(null);

  // Add new state for video controls
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);



  // Modify useEffect to handle pre-selected videos
  useEffect(() => {
    if (initialVideoSrc && isPreselectedVideo) {
      setVideoSrc(initialVideoSrc);
      // If it's a pre-selected video, we can skip the upload step
      // and directly move to processing
    }
  }, [initialVideoSrc, isPreselectedVideo]);

  useEffect(() => {
    const startTranscription = async () => {
      if (initialVideoFile && initialVideoSrc) {
        // Set video preview
        setVideoPreview(initialVideoSrc);
        setCurrentFile(initialVideoFile);

        // Reset subtitle position to center
        setSubtitlePosition({ y: 3 });

        // Start transcription process
        setShowTranscriptionModal(true);
        onUpload(
          initialVideoFile,
          setTranscription,
          (isTranscribing) => {
            setIsTranscribing(isTranscribing);
            // When transcription is complete, scroll to the text editor
            if (!isTranscribing && textEditorRef.current) {
              setTimeout(() => {
                textEditorRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
                setShowTranscriptionModal(false);
              }, 1000);
            }
          },
          setAudioUrl,
          setUniqueId,
          (segments) => setSegments(preprocessSegments(segments))
        );
      }
    };

    startTranscription();
  }, [initialVideoFile, initialVideoSrc, onUpload]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Clean up previous video URL if it exists
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }
      if (subtitledVideoUrl) {
        setSubtitledVideoUrl(null);
      }

      // Reset states for new video
      setTranscription("");
      setIsTranscribing(false);
      setIsGeneratingSubtitles(false);
      setAudioUrl("");

      // Create a URL for the new video preview
      const previewUrl = URL.createObjectURL(file);
      setVideoPreview(previewUrl);
      setCurrentFile(file);

      // Reset subtitle position to center
      setSubtitlePosition({ y: 3 });

      // Start the transcription process and show the modal
      setShowTranscriptionModal(true);
      onUpload(
        file,
        setTranscription,
        (isTranscribing) => {
          setIsTranscribing(isTranscribing);
          // When transcription is complete, scroll to the text editor
          if (!isTranscribing && textEditorRef.current) {
            setTimeout(() => {
              textEditorRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
              setShowTranscriptionModal(false);
            }, 1000);
          }
        },
        setAudioUrl,
        setUniqueId,
        (segments) => setSegments(preprocessSegments(segments))
      );
    }
  };

  // Format time from seconds to MM:SS.ms format
  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    const milliseconds = Math.floor((timeInSeconds % 1) * 1000);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  };

  // Update a specific segment's text
  const updateSegmentText = (id: number, newText: string) => {
    setSegments(prevSegments => 
      prevSegments.map(segment => 
        segment.id === id ? { ...segment, text: newText } : segment
      )
    );
    
    // Also update the full transcription for compatibility with existing code
    const updatedTranscription = segments
      .map(segment => segment.id === id ? newText : segment.text)
      .join(' ');
    setTranscription(updatedTranscription);
  };

  const handleGenerateSubtitles = async () => {
    if (!audioUrl || !transcription) return;

    try {
      setIsGeneratingSubtitles(true);

      // Get video dimensions for positioning
      const videoElement = document.querySelector("video");
      const videoRect = videoElement?.getBoundingClientRect();

      if (!videoRect) {
        console.error("Could not get video dimensions");
        return;
      }

      const formData = new FormData();
      formData.append('video', currentFile!);
      formData.append('audioUrl', audioUrl);
      formData.append('uniqueId', uniqueId);
      formData.append('transcription', transcription);
      formData.append('segments', JSON.stringify(segments));
      formData.append('subtitleColors', JSON.stringify(subtitleColors));
      formData.append('subtitleFont', subtitleFont);
      formData.append('subtitlePosition', JSON.stringify(subtitlePosition));
      formData.append('subtitleSize', subtitleSize.toString());

      const response = await fetch("/api/add-subtitles", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.subtitledVideoUrl) {
        setSubtitledVideoUrl(null);
        setSubtitledVideoUrl(data.subtitledVideoUrl);
        // Scroll to video component after subtitle generation
        setTimeout(() => {
          videoComponentRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }, 1000);
      } else {
        console.error("Failed to generate subtitles");
      }
    } catch (error) {
      console.error("Error generating subtitles:", error);
    } finally {
      setIsGeneratingSubtitles(false);
    }
  };

  const handleRemoveVideo = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setVideoPreview(null);
    setCurrentFile(null);
    setTranscription("");
    setIsTranscribing(false);
    setIsGeneratingSubtitles(false);
    setAudioUrl("");
    setSubtitledVideoUrl(null);
    setSubtitlePosition({ y: 3 });
    
    // Call the onRemove callback to notify parent
    if (onRemove) {
      onRemove();
    }
  };

  // Clean up the URL when component unmounts or video changes
  useEffect(() => {
    return () => {
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }
    };
  }, [videoPreview]);

  // Modify the handleDownload function to handle both local and external URLs
  const handleDownload = async () => {
    const videoUrl = subtitledVideoUrl || videoPreview;
    if (!videoUrl) return;

    try {
      let blob;

      if (subtitledVideoUrl) {
        // For subtitled video, use our backend API to handle the download
        const response = await fetch("/api/download-video", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ videoUrl: subtitledVideoUrl }),
        });

        if (!response.ok) {
          throw new Error("Failed to download video");
        }

        blob = await response.blob();
      } else {
        // For original video (local URL), use simple fetch
        const response = await fetch(videoUrl);
        blob = await response.blob();
      }

      // Create a temporary link element
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);

      // Set suggested filename based on whether it's subtitled or original
      const filename = subtitledVideoUrl
        ? "subtitled-video.mp4"
        : "original-video.mp4";
      link.download = filename;

      // Append to body, click and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the URL
      window.URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Error downloading video:", error);
      alert("Failed to download video. Please try again.");
    }
  };

  // Create a subtitle style object from the current settings
  const subtitleStyle: SubtitleStyle = {
    font: subtitleFont,
    position: subtitlePosition,
    colors: subtitleColors,
    fontSize: subtitleSize
  };

  // Handle play/pause toggle
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handle video time update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // Handle seeking
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  // Handle mute toggle
  const toggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = volume || 0.5;
        setIsMuted(false);
      } else {
        videoRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  // Format time for display (MM:SS)
  const formatDisplayTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Update duration when video metadata is loaded
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      
      // Calculate font size range based on video dimensions
      const videoWidth = videoRef.current.videoWidth;
      const videoHeight = videoRef.current.videoHeight;
      
      // Use width as the primary dimension for scaling
      // For a 640px width video, we use 15px min and 64px max as reference
      const minFontSize = Math.round((videoWidth / 640) * 15);
      const maxFontSize = Math.round((videoWidth / 640) * 64);
      
      setFontSizeRange({ min: minFontSize, max: maxFontSize });
      
      setSubtitleSize(Math.round((minFontSize+maxFontSize)/2));
    }
  };

  // Update play state when video ends
  const handleVideoEnded = () => {
    setIsPlaying(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-900 to-indigo-950 border-b border-indigo-800/30 py-6">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-white text-center">
            AI Video Subtitler
          </h1>
        </div>
      </header>

      <main className="flex-grow py-12 px-4">
        <div className="w-full max-w-6xl mx-auto">
          {!videoPreview ? (
            <div className="flex flex-col items-center justify-center mt-8 md:mt-20 px-4">
              <div className="w-full max-w-xl">
                <div className="bg-gradient-to-br from-gray-900/95 via-indigo-950/90 to-gray-900/95 rounded-2xl p-8 md:p-10 backdrop-blur-sm border border-indigo-800/30 shadow-xl">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="mb-6 bg-indigo-500/10 p-4 rounded-full">
                      <FontAwesomeIcon
                        icon={faUpload}
                        className="text-3xl md:text-4xl text-indigo-400"
                      />
                    </div>
                    <h2 className="text-xl md:text-2xl font-semibold text-white mb-3">
                      Upload Your Video
                    </h2>
                    <p className="text-gray-300 text-sm md:text-base mb-8 max-w-md">
                      Add professional subtitles to your video in minutes. Our
                      AI will transcribe your content and generate perfectly
                      timed subtitles.
                    </p>

                    <label className="cursor-pointer group">
                      <div className="px-6 py-3 md:px-8 md:py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg group-hover:from-indigo-600 group-hover:to-purple-700 transition-all duration-300 shadow-lg shadow-indigo-500/20 font-medium text-base md:text-lg flex items-center gap-3">
                        <FontAwesomeIcon icon={faUpload} />
                        Select Video File
                      </div>
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-6xl mx-auto space-y-6">
              {/* Top section with video and customization */}
              <div className="bg-gradient-to-br from-gray-900/95 via-indigo-950/90 to-gray-900/95 rounded-2xl backdrop-blur-sm border border-indigo-800/30 shadow-xl">
                <div className="grid md:grid-cols-2 gap-6 p-6 md:p-8">
                  {/* Left side - Video Preview Section */}
                  <div ref={videoComponentRef} className="space-y-5">
                    <h2 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                      <span className="w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400">
                        <FontAwesomeIcon icon={faVideo} />
                      </span>
                      Video Preview
                    </h2>

                    <div className="flex flex-col">
                      {/* Video container */}
                      <div className="aspect-video bg-black rounded-xl overflow-hidden relative shadow-lg border border-gray-800">
                        <video
                          ref={videoRef}
                          src={subtitledVideoUrl || videoPreview}
                          className="w-full h-full"
                          onTimeUpdate={handleTimeUpdate}
                          onLoadedMetadata={handleLoadedMetadata}
                          onEnded={handleVideoEnded}
                        />
                        <SubtitleRenderer
                          videoRef={videoRef}
                          segments={segments}
                          subtitleStyle={subtitleStyle}
                          visible={!subtitledVideoUrl}
                        />
                      </div>
                      
                      {/* Custom video controls */}
                      <div className="mt-3 bg-gray-900/80 rounded-lg p-3 border border-gray-800/50">
                        <div className="flex flex-col space-y-2">
                          {/* Progress bar */}
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-400 w-10">{formatDisplayTime(currentTime)}</span>
                            <input
                              type="range"
                              min="0"
                              max={duration || 100}
                              step="0.1"
                              value={currentTime}
                              onChange={handleSeek}
                              className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                            <span className="text-xs text-gray-400 w-10">{formatDisplayTime(duration)}</span>
                          </div>
                          
                          {/* Controls */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {/* Play/Pause button */}
                              <button 
                                onClick={togglePlay}
                                className="text-white hover:text-indigo-400 transition-colors"
                              >
                                <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} className="text-lg" />
                              </button>
                              
                              {/* Volume controls */}
                              <div className="flex items-center space-x-2">
                                <button 
                                  onClick={toggleMute}
                                  className="text-white hover:text-indigo-400 transition-colors"
                                >
                                  <FontAwesomeIcon icon={isMuted ? faVolumeMute : faVolumeUp} className="text-lg" />
                                </button>
                                <input
                                  type="range"
                                  min="0"
                                  max="1"
                                  step="0.01"
                                  value={isMuted ? 0 : volume}
                                  onChange={handleVolumeChange}
                                  className="w-20 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <button
                        onClick={handleRemoveVideo}
                        className="flex items-center justify-center gap-2 px-5 py-3 bg-[#1F1625] hover:bg-[#2A1C31] text-red-400 rounded-xl transition-all duration-300 font-medium border border-red-500/20 shadow-lg shadow-red-500/5"
                      >
                        <FontAwesomeIcon icon={faTrash} className="text-sm" />
                        <span>Remove Video</span>
                      </button>
                      <label className="flex items-center justify-center gap-2 px-5 py-3 bg-[#1A1E2E] hover:bg-[#232838] text-blue-400 rounded-xl transition-all duration-300 cursor-pointer font-medium border border-blue-500/20 shadow-lg shadow-blue-500/5">
                        <FontAwesomeIcon
                          icon={faExchangeAlt}
                          className="text-sm"
                        />
                        <span>Change Video</span>
                        <input
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </label>
                      {/* Only show download button when subtitled video is available */}
                      {subtitledVideoUrl && (
                        <button
                          onClick={handleDownload}
                          className="flex items-center justify-center gap-2 px-5 py-3 bg-[#162521] hover:bg-[#1C312A] text-green-400 rounded-xl transition-all duration-300 font-medium border border-green-500/20 shadow-lg shadow-green-500/5"
                        >
                          <FontAwesomeIcon
                            icon={faDownload}
                            className="text-sm"
                          />
                          <span>Download</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right side - Controls Section */}
                  <div className="space-y-5">
                    <h2 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                      <span className="w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400">
                        <FontAwesomeIcon icon={faSliders} />
                      </span>
                      Subtitle Customization
                    </h2>

                    <div className="bg-gradient-to-b from-gray-900/90 to-gray-950/90 backdrop-blur-sm rounded-xl border border-indigo-800/20 p-5 shadow-lg">
                      <div className="space-y-5">
                        {/* Size Control */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <FontAwesomeIcon
                                icon={faTextHeight}
                                className="text-indigo-400"
                              />
                              <span className="text-sm font-medium text-gray-300">
                                Font Size
                              </span>
                            </div>
                            <span className="text-sm font-medium text-indigo-400">
                              {subtitleSize}px
                            </span>
                          </div>
                          <Slider
                            defaultValue={[subtitleSize]}
                            min={fontSizeRange.min}
                            max={fontSizeRange.max}
                            step={1}
                            onValueCommit={(values) => {
                              console.log(values);
                              setSubtitleSize(values[0]);
                            }}
                            className="w-full custom-slider"
                          />
                          <style jsx global>{`
                            .custom-slider [data-orientation="horizontal"] {
                              height: 4px;
                              width: 100%;
                              background: #374151;
                              border-radius: 9999px;
                            }
                            
                            .custom-slider [role="slider"] {
                              display: block;
                              width: 20px;
                              height: 20px;
                              background-color: white;
                              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                              border-radius: 9999px;
                              cursor: pointer;
                            }

                            .custom-slider [data-orientation="horizontal"] > span {
                              height: 100%;
                              background: linear-gradient(90deg, #6366f1, #8b5cf6);
                              border-radius: 9999px;
                            }
                          `}</style>
                        </div>

                        {/* Desktop Subtitle Customizer */}
                        <SubtitleCustomizer
                          subtitleColors={subtitleColors}
                          subtitleFont={subtitleFont}
                          subtitlePosition={subtitlePosition}
                          onColorChange={(color, type) => {
                            switch (type) {
                              case "line1-text":
                                setSubtitleColors({
                                  ...subtitleColors,
                                  line1: {
                                    ...subtitleColors.line1,
                                    text: color.hex,
                                  },
                                });
                                break;
                              case "line1-bg":
                                setSubtitleColors({
                                  ...subtitleColors,
                                  line1: {
                                    ...subtitleColors.line1,
                                    background: color.hex,
                                  },
                                });
                                break;
                            }
                          }}
                          onFontChange={setSubtitleFont}
                          onPositionChange={setSubtitlePosition}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Full-width Transcription Section */}
              <div className="bg-gradient-to-br from-gray-900/95 via-indigo-950/90 to-gray-900/95 rounded-2xl backdrop-blur-sm border border-indigo-800/30 shadow-xl">
                <div className="p-6 md:p-8">
                  <div className="mb-6 flex items-center gap-2">
                    <span className="w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400">
                      <FontAwesomeIcon icon={faFileAlt} />
                    </span>
                    <h2 className="text-xl font-semibold text-white">
                      Video Transcription
                    </h2>
                  </div>

                  <div className="bg-gray-900/80 rounded-xl border border-gray-700/50 p-6 shadow-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
                      <p className="text-gray-300 text-sm md:text-base">
                        {isTranscribing
                          ? "Transcribing your video..."
                          : transcription
                          ? "Edit the transcription if needed before generating subtitles."
                          : "Click the button to start transcribing your video."}
                      </p>

                      {!transcription && !isTranscribing && (
                        <button
                          onClick={() =>
                            onUpload(
                              currentFile!,
                              setTranscription,
                              setIsTranscribing,
                              setAudioUrl,
                              setUniqueId,
                              (segments) => setSegments(preprocessSegments(segments))
                            )
                          }
                          className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm md:text-base font-medium flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                        >
                          <FontAwesomeIcon icon={faMicrophone} />
                          Start Transcription
                        </button>
                      )}
                    </div>

                    {isTranscribing && (
                      <div className="flex items-center justify-center space-x-3 text-gray-300 mb-5 py-8 bg-gray-800/50 rounded-lg">
                        <div className="animate-spin rounded-full h-8 w-8 border-3 border-indigo-500 border-t-transparent"></div>
                        <span className="font-medium">
                          Transcribing your video...
                        </span>
                      </div>
                    )}

                    {/* Replace textarea with segment editor */}
                    {segments.length > 0 ? (
                      <div className="w-full h-[250px] md:h-[300px] lg:h-[400px] overflow-y-auto p-5 bg-[#0B1120] text-gray-200 rounded-xl border border-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                        {segments.map((segment) => (
                          <div key={segment.id} className="mb-4 p-3 bg-gray-800/40 rounded-lg hover:bg-gray-800/60 transition-colors">
                            <div className="flex justify-between text-xs text-gray-400 mb-2">
                              <span>{formatTime(segment.start)}</span>
                              <span>{formatTime(segment.end)}</span>
                            </div>
                            <textarea
                              value={segment.text}
                              onChange={(e) => updateSegmentText(segment.id, e.target.value)}
                              className="w-full p-2 bg-[#0B1120] text-gray-200 rounded-lg border border-gray-700 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500/50 text-base"
                              rows={2}
                              disabled={isTranscribing}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <textarea
                        ref={textEditorRef}
                        value={transcription}
                        onChange={(e) => setTranscription(e.target.value)}
                        className="w-full h-[250px] md:h-[300px] lg:h-[400px] p-5 bg-[#0B1120] text-gray-200 rounded-xl border border-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-base md:text-lg"
                        placeholder="Transcription will appear here..."
                        disabled={isTranscribing}
                      />
                    )}

                    {/* Generate Button */}
                    {transcription && !isTranscribing && (
                      <div className="flex justify-end mt-6">
                        <button
                          onClick={handleGenerateSubtitles}
                          disabled={isGeneratingSubtitles}
                          className={`px-6 py-3 md:px-8 md:py-3.5 rounded-lg transition-all duration-300 flex items-center gap-3 text-base md:text-lg font-medium shadow-lg ${
                            isGeneratingSubtitles
                              ? "bg-gradient-to-r from-green-500/70 to-emerald-600/70 text-white/80 cursor-not-allowed"
                              : "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-green-500/20"
                          }`}
                        >
                          {isGeneratingSubtitles ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-3 border-white border-t-transparent"></div>
                              <span>Generating Subtitles...</span>
                            </>
                          ) : (
                            <>
                              <FontAwesomeIcon icon={faCheck} />
                              Generate Subtitles
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading Overlay */}
          {isGeneratingSubtitles && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-gradient-to-b from-gray-900 to-gray-950 rounded-xl p-8 flex flex-col items-center gap-5 max-w-md mx-4 border border-indigo-800/30 shadow-2xl">
                <div className="animate-spin rounded-full h-14 w-14 border-4 border-green-500 border-t-transparent"></div>
                <div className="text-xl text-white font-medium">
                  Generating Subtitles
                </div>
                <div className="text-gray-300 text-center">
                  We're processing your video and adding professional subtitles.
                  This may take a few moments.
                </div>
                <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-gradient-to-r from-green-500 to-emerald-600 animate-pulse rounded-full"></div>
                </div>
              </div>
            </div>
          )}

          {/* Transcription Started Modal */}
          {showTranscriptionModal && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-gradient-to-b from-gray-900 to-gray-950 rounded-xl p-8 flex flex-col items-center gap-5 max-w-md mx-4 border border-indigo-800/30 shadow-2xl">
                <div className="animate-spin rounded-full h-14 w-14 border-4 border-indigo-500 border-t-transparent"></div>
                <div className="text-xl text-white font-medium">
                  Transcription Started
                </div>
                <div className="text-gray-300 text-center">
                  We're analyzing your video and creating a transcript. This may
                  take a few moments depending on the length of your video.
                </div>
                <button
                  onClick={() => setShowTranscriptionModal(false)}
                  className="mt-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 to-indigo-950 border-t border-indigo-800/30 py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            © {new Date().getFullYear()} Euler Labs. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default VideoUpload;

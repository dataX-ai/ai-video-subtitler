"use client";

import { useState, useEffect } from "react";
import VideoUpload from "./components/VideoUpload";
import { FaPlay, FaUpload, FaSpinner } from "react-icons/fa";

// Sample videos from public folder
const sampleVideos = [
  {
    id: 1,
    title: "Product Demo",
    src: "/videos/product-demo.mp4",
    description: "A demonstration of our product features",
  },
  {
    id: 2,
    title: "Tutorial",
    src: "/videos/tutorial.mp4",
    description: "Learn how to use our application",
  },
  {
    id: 3,
    title: "Customer Testimonial",
    src: "/videos/testimonial.mp4",
    description: "Hear what our customers have to say",
  },
];

// Fallback images for videos
const fallbackImages = [
  "/videos/thumbnails/product-demo.jpg",
  "/videos/thumbnails/tutorial.jpg",
  "/videos/thumbnails/testimonial.jpg",
];

export default function Home() {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [isUploadedVideo, setIsUploadedVideo] = useState(false);
  const [videoLoading, setVideoLoading] = useState<{ [key: number]: boolean }>({
    0: true,
    1: true,
    2: true,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showVideoUpload, setShowVideoUpload] = useState(false);
  const [videosMissing, setVideosMissing] = useState(false);

  // Handle sample video selection
  const handleSampleVideoSelect = async (videoSrc: string, index: number) => {
    console.log("Selected sample video:", videoSrc);

    try {
      // Show loading state
      const loadingElement = document.getElementById(`video-loading-${index}`);
      if (loadingElement) {
        loadingElement.style.display = "flex";
      }

      // Pause all videos
      document.querySelectorAll("video").forEach((video) => {
        video.pause();
      });

      // Fetch the video file to convert it to a File object
      const response = await fetch(videoSrc);
      const blob = await response.blob();
      const filename = videoSrc.split("/").pop() || "video.mp4";
      const file = new File([blob], filename, { type: "video/mp4" });

      // Set state variables
      setSelectedVideo(videoSrc);
      setIsUploadedVideo(false);
      setSelectedFile(file);

      // Delay showing the VideoUpload component to prevent UI flash
      setTimeout(() => {
        setShowVideoUpload(true);
      }, 100);
    } catch (error) {
      console.error("Error fetching sample video:", error);
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      setSelectedVideo(fileUrl);
      setIsUploadedVideo(true);
      setSelectedFile(file);

      // Delay showing the VideoUpload component to prevent UI flash
      setTimeout(() => {
        setShowVideoUpload(true);
      }, 100);
    }
  };

  const handleVideoLoad = (index: number) => {
    console.log(`Video ${index} loaded`);
    setVideoLoading((prev) => ({ ...prev, [index]: false }));
  };

  const handleVideoError = (index: number) => {
    console.error(`Error loading video ${index}`);
    setVideoLoading((prev) => ({ ...prev, [index]: false }));

    // Show error message
    const videoElement = document.getElementById(
      `video-${index}`
    ) as HTMLVideoElement;
    if (videoElement) {
      videoElement.style.display = "none";
    }
  };

  // Update the useEffect to check if sample videos exist
  useEffect(() => {
    // Check if sample videos exist
    const checkVideos = async () => {
      let missing = false;
      for (let i = 0; i < sampleVideos.length; i++) {
        try {
          const response = await fetch(sampleVideos[i].src, { method: "HEAD" });
          if (!response.ok) {
            console.error(
              `Sample video ${i + 1} not found:`,
              sampleVideos[i].src
            );
            missing = true;
            setVideoLoading((prev) => ({ ...prev, [i]: false }));
          }
        } catch (error) {
          console.error(`Error checking sample video ${i + 1}:`, error);
          missing = true;
          setVideoLoading((prev) => ({ ...prev, [i]: false }));
        }
      }
      setVideosMissing(missing);
    };

    checkVideos();

    // Initialize video elements
    const initializeVideos = () => {
      sampleVideos.forEach((_, index) => {
        const videoElement = document.getElementById(
          `video-${index}`
        ) as HTMLVideoElement;
        if (videoElement) {
          // Enable controls and set initial volume
          videoElement.controls = true;
          videoElement.volume = 0.5;

          // Add click handler to prevent propagation
          const clickHandler = (e: Event) => {
            e.stopPropagation();
          };

          videoElement.addEventListener("click", clickHandler);

          // Force reload the video source
          const currentSrc = videoElement.src;
          videoElement.src = "";
          videoElement.load();
          videoElement.src = currentSrc;

          // Return cleanup function
          return () => {
            videoElement.removeEventListener("click", clickHandler);
          };
        }
      });
    };

    // Initialize videos after a short delay to ensure DOM is ready
    const timeoutId = setTimeout(initializeVideos, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  // If a video is selected and we're ready to show the VideoUpload component
  if (showVideoUpload && selectedVideo && selectedFile) {
    return (
      <VideoUpload
        initialVideoSrc={selectedVideo}
        initialVideoFile={selectedFile}
        isPreselectedVideo={!isUploadedVideo}
        onUpload={async (
          file: File,
          setTranscription: (text: string) => void,
          setIsTranscribing: (value: boolean) => void,
          setAudioUrl: (url: string) => void,
          setUniqueId: (id: string) => void
        ) => {
          const formData = new FormData();
          formData.append("video", file);

          try {
            setIsTranscribing(true);
            const response = await fetch("/api/transcribe", {
              method: "POST",
              body: formData,
            });
            const data = await response.json();

            if (data.transcription && data.audioUrl && data.uniqueId) {
              setTranscription(data.transcription);
              setAudioUrl(data.audioUrl);
              setUniqueId(data.uniqueId);
            } else if (data.error) {
              console.error("Transcription error:", data.error);
            }
          } catch (error) {
            console.error("Error uploading video:", error);
          } finally {
            setIsTranscribing(false);
          }
        }}
      />
    );
  }

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
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xl text-gray-300">
              Add professional subtitles to your videos with AI-powered
              transcription
            </p>
          </div>

          {/* Sample Videos Section - One Row */}
          <div className="mb-12">
            <div className="bg-gradient-to-br from-gray-900/80 via-indigo-950/80 to-gray-900/80 rounded-2xl backdrop-blur-sm border border-indigo-800/30 shadow-xl p-6 md:p-8">
              <h2 className="text-2xl font-semibold text-white mb-6">
                Select a Sample Video
              </h2>

              {videosMissing && (
                <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-200">
                  <p className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <span>
                      Sample videos not found. Please add videos to the{" "}
                      <code className="bg-gray-800 px-1 py-0.5 rounded">
                        /public/videos/
                      </code>{" "}
                      directory with the names: product-demo.mp4, tutorial.mp4,
                      and testimonial.mp4
                    </span>
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {sampleVideos.map((video, index) => (
                  <div
                    key={video.id}
                    className="bg-gradient-to-br from-gray-900/95 via-indigo-950/90 to-gray-900/95 rounded-xl backdrop-blur-sm border border-indigo-800/30 shadow-xl overflow-hidden group hover:border-indigo-500/50 transition-all duration-300 w-full"
                  >
                    <div className="relative aspect-video bg-gray-800">
                      {/* Video element */}
                      <video
                        id={`video-${index}`}
                        src={video.src}
                        className="w-full h-full object-cover"
                        controls
                        preload="auto"
                        playsInline
                        onLoadedData={() => handleVideoLoad(index)}
                        onError={() => handleVideoError(index)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <source src={video.src} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>

                      {/* Loading spinner */}
                      {videoLoading[index] && (
                        <div
                          id={`video-loading-${index}`}
                          className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-20"
                        >
                          <FaSpinner className="animate-spin text-indigo-500 w-8 h-8" />
                        </div>
                      )}
                    </div>

                    {/* Video info and buttons */}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {video.title}
                      </h3>
                      <p className="text-sm text-gray-300 mb-4">
                        {video.description}
                      </p>

                      {/* Select button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleSampleVideoSelect(video.src, index);
                        }}
                        className="w-full px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                      >
                        <FaPlay className="w-4 h-4" />
                        <span>Select This Video</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Upload Section - Separate Row */}
          <div className="mb-12">
            <div className="bg-gradient-to-br from-gray-900/80 via-indigo-950/80 to-gray-900/80 rounded-2xl backdrop-blur-sm border border-indigo-800/30 shadow-xl p-6 md:p-8">
              <h2 className="text-2xl font-semibold text-white mb-6">
                Or Upload Your Own Video
              </h2>
              <div className="bg-gradient-to-br from-gray-900/95 via-indigo-950/90 to-gray-900/95 rounded-xl backdrop-blur-sm border border-indigo-800/30 shadow-xl p-8 text-center hover:border-indigo-500/50 transition-all duration-300">
                <div className="max-w-xl mx-auto py-8">
                  <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FaUpload className="w-10 h-10 text-indigo-400" />
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-4">
                    Upload Your Video
                  </h3>
                  <p className="text-gray-300 mb-8 text-lg">
                    Upload your own video to add AI-powered subtitles
                  </p>
                  <input
                    type="file"
                    id="video-upload"
                    accept="video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="video-upload"
                    className="inline-block px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 cursor-pointer font-medium shadow-lg shadow-indigo-500/20 text-lg"
                  >
                    Choose Video File
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="grid md:grid-cols-2 gap-12 items-start max-w-6xl mx-auto mt-12">
            <div className="bg-gradient-to-br from-gray-900/80 via-indigo-950/80 to-gray-900/80 rounded-2xl backdrop-blur-sm border border-indigo-800/30 shadow-xl p-6">
              <h2 className="text-2xl font-semibold text-white mb-4">
                How it works
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                    1
                  </div>
                  <p className="text-gray-300">
                    Select a sample video or upload your own
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                    2
                  </div>
                  <p className="text-gray-300">
                    AI generates accurate subtitles
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                    3
                  </div>
                  <p className="text-gray-300">Customize style and placement</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-900/80 via-indigo-950/80 to-gray-900/80 rounded-2xl backdrop-blur-sm border border-indigo-800/30 shadow-xl p-6">
              <h2 className="text-2xl font-semibold text-white mb-4">
                Features
              </h2>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-blue-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  AI-powered subtitle generation
                </li>
                <li className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-blue-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Custom subtitle styling
                </li>
                <li className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-blue-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Flexible positioning
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 to-indigo-950 border-t border-indigo-800/30 py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            © {new Date().getFullYear()} AI Video Subtitler. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

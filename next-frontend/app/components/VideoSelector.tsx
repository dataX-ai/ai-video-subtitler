"use client";

import { useState, useRef, useEffect } from "react";
import { FaPlay, FaPause } from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faVideo,
  faUpload as faUploadSolid,
} from "@fortawesome/free-solid-svg-icons";

// Sample video data with actual videos
const sampleVideos = [
  {
    id: 1,
    title: "Product Demo",
    src: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", // Sample video 1
    duration: "1:30",
    description: "A demonstration of our product features",
  },
  {
    id: 2,
    title: "Tutorial",
    src: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4", // Sample video 2
    duration: "2:45",
    description: "Learn how to use our application",
  },
  {
    id: 3,
    title: "Customer Testimonial",
    src: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4", // Sample video 3
    duration: "1:15",
    description: "Hear what our customers have to say",
  },
];

interface VideoSelectorProps {
  onVideoSelect: (videoSrc: string, isUpload: boolean) => void;
}

const VideoSelector = ({ onVideoSelect }: VideoSelectorProps) => {
  const [selectedVideo, setSelectedVideo] = useState<number | null>(null);
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [hoveredVideo, setHoveredVideo] = useState<number | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    videoRefs.current = videoRefs.current.slice(0, sampleVideos.length);
  }, []);

  const handleSampleVideoSelect = (videoId: number) => {
    setSelectedVideo(videoId);
    const video = sampleVideos.find((v) => v.id === videoId);
    if (video) {
      setUploadedVideo(null);
      setUploadedVideoUrl(null);
      onVideoSelect(video.src, false);
    }
  };

  const handleVideoHover = (index: number, isHovering: boolean) => {
    setHoveredVideo(isHovering ? index : null);
    const videoElement = videoRefs.current[index];
    if (videoElement) {
      if (isHovering) {
        videoElement
          .play()
          .catch((err) => console.log("Video play prevented:", err));
      } else {
        videoElement.pause();
        videoElement.currentTime = 0;
      }
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const fileUrl = URL.createObjectURL(file);
    setUploadedVideo(file);
    setUploadedVideoUrl(fileUrl);
    setSelectedVideo(null);
    setIsUploading(false);
    onVideoSelect(fileUrl, true);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="bg-gradient-to-br from-gray-900/95 via-indigo-950/90 to-gray-900/95 rounded-2xl backdrop-blur-sm border border-indigo-800/30 shadow-xl p-6 md:p-8">
        <h2 className="text-xl font-semibold text-white mb-8 flex items-center gap-2">
          <span className="w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400">
            <FontAwesomeIcon icon={faVideo} />
          </span>
          Select a Video
        </h2>

        <div className="mb-10">
          <h3 className="text-lg font-semibold text-white mb-6">
            Sample Videos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sampleVideos.map((video, index) => (
              <div
                key={video.id}
                className={`group relative rounded-xl overflow-hidden transition-all duration-300 ${
                  selectedVideo === video.id
                    ? "ring-2 ring-indigo-500 shadow-lg shadow-indigo-500/20 transform scale-[1.02]"
                    : "border border-gray-700 hover:border-indigo-500/50"
                }`}
                onMouseEnter={() => handleVideoHover(index, true)}
                onMouseLeave={() => handleVideoHover(index, false)}
                onClick={() => handleSampleVideoSelect(video.id)}
              >
                <div className="relative aspect-video bg-gray-900">
                  <video
                    ref={(el) => (videoRefs.current[index] = el)}
                    src={video.src}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                    loop
                  />
                  <div
                    className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity duration-300 ${
                      hoveredVideo === index ? "opacity-0" : "opacity-100"
                    }`}
                  >
                    <div className="rounded-full bg-indigo-500/80 p-3 backdrop-blur-sm">
                      {hoveredVideo === index ? (
                        <FaPause className="text-white w-6 h-6" />
                      ) : (
                        <FaPlay className="text-white w-6 h-6" />
                      )}
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-black/0">
                  <h4 className="font-medium text-white mb-1">{video.title}</h4>
                  <p className="text-sm text-gray-300">{video.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-6">
            Upload Your Own Video
          </h3>
          <div className="border-2 border-dashed border-gray-700 hover:border-indigo-500/50 rounded-xl p-8 text-center transition-colors bg-gray-900/50">
            {uploadedVideoUrl ? (
              <div className="space-y-5">
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    src={uploadedVideoUrl}
                    className="w-full h-full object-contain"
                    controls
                  />
                </div>
                <p className="text-gray-300">
                  {uploadedVideo?.name} (
                  {(uploadedVideo?.size || 0) / (1024 * 1024) < 1
                    ? `${((uploadedVideo?.size || 0) / 1024).toFixed(2)} KB`
                    : `${((uploadedVideo?.size || 0) / (1024 * 1024)).toFixed(
                        2
                      )} MB`}
                  )
                </p>
                <button
                  onClick={() => {
                    setUploadedVideo(null);
                    setUploadedVideoUrl(null);
                  }}
                  className="px-5 py-2.5 bg-[#1F1625] hover:bg-[#2A1C31] text-red-400 rounded-xl transition-all duration-300 font-medium border border-red-500/20 shadow-lg shadow-red-500/5"
                >
                  Remove Video
                </button>
              </div>
            ) : (
              <div>
                <FontAwesomeIcon
                  icon={faUploadSolid}
                  className="mx-auto h-12 w-12 text-indigo-400"
                />
                <p className="mt-4 text-gray-300">
                  Drag and drop a video file here, or click to browse
                </p>
                <input
                  type="file"
                  id="video-upload"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                <label
                  htmlFor="video-upload"
                  className="mt-6 inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer transition-colors disabled:opacity-50 font-medium shadow-lg shadow-indigo-600/20"
                >
                  {isUploading ? "Uploading..." : "Select Video"}
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => {
              if (selectedVideo) {
                const video = sampleVideos.find((v) => v.id === selectedVideo);
                if (video) onVideoSelect(video.src, false);
              } else if (uploadedVideoUrl) {
                onVideoSelect(uploadedVideoUrl, true);
              }
            }}
            disabled={!selectedVideo && !uploadedVideoUrl}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue with Selected Video
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoSelector;

"use client";

import VideoUpload from "./components/VideoUpload";

export default function Home() {
  const handleUpload = async (
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
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Professional Video Subtitles
            <span className="block text-2xl md:text-3xl mt-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-400">
              Powered by AI
            </span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Transform your videos with custom subtitles in minutes. Perfect for
            content creators, educators, and businesses looking to reach a wider
            audience.
          </p>
        </div>

        {/* Main Content */}
        <VideoUpload onUpload={handleUpload} />

        {/* Features Section */}
        <div className="grid md:grid-cols-2 gap-12 items-start max-w-6xl mx-auto mt-24">
          <div className="bg-blue-500/10 rounded-2xl p-6 backdrop-blur-sm border border-blue-500/20">
            <h2 className="text-2xl font-semibold text-white mb-4">
              How it works
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                  1
                </div>
                <p className="text-gray-300">Upload your video</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                  2
                </div>
                <p className="text-gray-300">AI generates accurate subtitles</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                  3
                </div>
                <p className="text-gray-300">Customize style and placement</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-500/10 rounded-2xl p-6 backdrop-blur-sm border border-blue-500/20">
            <h2 className="text-2xl font-semibold text-white mb-4">Features</h2>
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
  );
}

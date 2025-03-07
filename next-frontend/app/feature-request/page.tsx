import FeatureRequestForm from "../components/FeatureRequestForm";

export default function FeatureRequestPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Request a Feature
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Help us shape the future of AI Video Subtitler by suggesting new
            features.
          </p>
        </div>
        <FeatureRequestForm />
      </div>
    </div>
  );
}

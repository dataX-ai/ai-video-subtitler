import FeedbackForm from "../components/FeedbackForm";

export default function FeedbackPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Share Your Feedback
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Your feedback helps us improve our service and create a better
            experience for everyone.
          </p>
        </div>
        <FeedbackForm />
      </div>
    </div>
  );
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Terms of Service
        </h1>

        <div className="prose dark:prose-invert max-w-none">
          <p className="mb-4">
            Last updated:{" "}
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing and using AI Video Subtitler, you accept and agree to
            be bound by the terms and provision of this agreement. If you do not
            agree to abide by the above, please do not use this service.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">
            2. Description of Service
          </h2>
          <p>
            AI Video Subtitler provides tools for adding subtitles to videos
            using artificial intelligence. We reserve the right to modify,
            suspend or discontinue the service at any time without notice.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">3. User Conduct</h2>
          <p>
            You agree to use AI Video Subtitler only for lawful purposes and in
            a way that does not infringe the rights of, restrict or inhibit
            anyone else's use and enjoyment of the service.
          </p>
          <p className="mt-2">Prohibited behavior includes:</p>
          <ul className="list-disc pl-6 mt-2 mb-4">
            <li>Using the service for any unlawful purpose</li>
            <li>Attempting to gain unauthorized access to our systems</li>
            <li>
              Uploading content that infringes on intellectual property rights
            </li>
            <li>Uploading harmful content or malware</li>
          </ul>

          <h2 className="text-xl font-semibold mt-6 mb-3">
            4. Intellectual Property
          </h2>
          <p>
            The service and its original content, features, and functionality
            are owned by AI Video Subtitler and are protected by international
            copyright, trademark, patent, trade secret, and other intellectual
            property or proprietary rights laws.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">
            5. Limitation of Liability
          </h2>
          <p>
            In no event shall AI Video Subtitler, nor its directors, employees,
            partners, agents, suppliers, or affiliates, be liable for any
            indirect, incidental, special, consequential or punitive damages,
            including without limitation, loss of profits, data, use, goodwill,
            or other intangible losses, resulting from your access to or use of
            or inability to access or use the service.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">6. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at:
          </p>
          <p className="mt-2">Email: terms@aivideosubtitler.com</p>
        </div>
      </div>
    </div>
  );
}

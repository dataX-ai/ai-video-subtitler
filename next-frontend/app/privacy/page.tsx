export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Privacy Policy
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

          <h2 className="text-xl font-semibold mt-6 mb-3">1. Introduction</h2>
          <p>
            Welcome to AI Video Subtitler. We respect your privacy and are
            committed to protecting your personal data. This privacy policy will
            inform you about how we look after your personal data when you visit
            our website and tell you about your privacy rights and how the law
            protects you.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">
            2. Data We Collect
          </h2>
          <p>
            We may collect, use, store and transfer different kinds of personal
            data about you which we have grouped together as follows:
          </p>
          <ul className="list-disc pl-6 mt-2 mb-4">
            <li>
              Identity Data: includes first name, last name, username or similar
              identifier
            </li>
            <li>Contact Data: includes email address and telephone numbers</li>
            <li>
              Technical Data: includes internet protocol (IP) address, browser
              type and version, time zone setting and location, browser plug-in
              types and versions, operating system and platform, and other
              technology on the devices you use to access this website
            </li>
            <li>
              Usage Data: includes information about how you use our website,
              products and services
            </li>
          </ul>

          <h2 className="text-xl font-semibold mt-6 mb-3">
            3. How We Use Your Data
          </h2>
          <p>
            We will only use your personal data when the law allows us to. Most
            commonly, we will use your personal data in the following
            circumstances:
          </p>
          <ul className="list-disc pl-6 mt-2 mb-4">
            <li>To provide and improve our services</li>
            <li>To respond to your inquiries</li>
            <li>
              To send you updates and marketing communications (with your
              consent)
            </li>
            <li>To comply with legal obligations</li>
          </ul>

          <h2 className="text-xl font-semibold mt-6 mb-3">4. Contact Us</h2>
          <p>
            If you have any questions about this privacy policy or our privacy
            practices, please contact us at:
          </p>
          <p className="mt-2">Email: privacy@aivideosubtitler.com</p>
        </div>
      </div>
    </div>
  );
}

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Cookie Policy
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
            1. What Are Cookies
          </h2>
          <p>
            Cookies are small pieces of text sent by your web browser by a
            website you visit. A cookie file is stored in your web browser and
            allows the service or a third-party to recognize you and make your
            next visit easier and the service more useful to you.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">
            2. How We Use Cookies
          </h2>
          <p>We use cookies for the following purposes:</p>
          <ul className="list-disc pl-6 mt-2 mb-4">
            <li>
              <strong>Essential cookies:</strong> These are cookies that are
              required for the operation of our website.
            </li>
            <li>
              <strong>Analytical/performance cookies:</strong> They allow us to
              recognize and count the number of visitors and to see how visitors
              move around our website when they are using it.
            </li>
            <li>
              <strong>Functionality cookies:</strong> These are used to
              recognize you when you return to our website.
            </li>
            <li>
              <strong>Targeting cookies:</strong> These cookies record your
              visit to our website, the pages you have visited and the links you
              have followed.
            </li>
          </ul>

          <h2 className="text-xl font-semibold mt-6 mb-3">
            3. Third-Party Cookies
          </h2>
          <p>
            In addition to our own cookies, we may also use various third-party
            cookies to report usage statistics of the service, deliver
            advertisements on and through the service, and so on.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">
            4. What Are Your Choices Regarding Cookies
          </h2>
          <p>
            If you'd like to delete cookies or instruct your web browser to
            delete or refuse cookies, please visit the help pages of your web
            browser.
          </p>
          <p className="mt-2">
            Please note, however, that if you delete cookies or refuse to accept
            them, you might not be able to use all of the features we offer, you
            may not be able to store your preferences, and some of our pages
            might not display properly.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">5. Contact Us</h2>
          <p>
            If you have any questions about our Cookie Policy, please contact us
            at:
          </p>
          <p className="mt-2">Email: cookies@aivideosubtitler.com</p>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { FaEnvelope, FaGithub, FaTwitter, FaLinkedin } from "react-icons/fa";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-gradient-to-r from-gray-800 to-gray-900 text-white py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">About</h3>
            <p className="text-gray-300">
              AI Video Subtitler - Making video content accessible to everyone.
            </p>
            <div className="flex space-x-4 pt-2">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-blue-400 transition-colors"
              >
                <FaTwitter size={20} />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white transition-colors"
              >
                <FaGithub size={20} />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-blue-500 transition-colors"
              >
                <FaLinkedin size={20} />
              </a>
            </div>
          </div>

          {/* Feature Request Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">
              Request a Feature
            </h3>
            <p className="text-gray-300">
              Have an idea to make our service better? We&apos;d love to hear
              it!
            </p>
            <Link
              href="/feature-request"
              className="inline-block text-blue-400 hover:text-blue-300 transition-colors"
            >
              Submit a feature request →
            </Link>
          </div>

          {/* Feedback Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">
              Share Your Feedback
            </h3>
            <p className="text-gray-300">
              Your feedback helps us improve. Let us know what you think!
            </p>
            <Link
              href="/feedback"
              className="inline-block text-blue-400 hover:text-blue-300 transition-colors"
            >
              Submit feedback →
            </Link>
          </div>
        </div>

        {/* Contact Section */}
        <div className="border-t border-gray-700 mt-8 pt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Contact Us</h3>
            <div className="flex items-center">
              <FaEnvelope className="text-gray-300 mr-2" />
              <span className="text-gray-300">
                support@aivideosubtitler.com
              </span>
            </div>
            <p className="text-gray-300">
              Have questions? We&apos;re here to help!
            </p>
            <Link
              href="/contact"
              className="inline-block text-blue-400 hover:text-blue-300 transition-colors"
            >
              Get in touch →
            </Link>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/cookies"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            © {currentYear} AI Video Subtitler. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

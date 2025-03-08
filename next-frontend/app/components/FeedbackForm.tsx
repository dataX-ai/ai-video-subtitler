"use client";

import { useState, useEffect } from "react";
import Modal from "./Modal";
import { useRouter } from "next/navigation";

const FeedbackForm = () => {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    type: "general",
    rating: "5",
    feedback: "",
    email: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/form-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formType: 'feedback',
          data: formData
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit form');
      }

      // Reset form
      setFormData({
        type: "general",
        rating: "5",
        feedback: "",
        email: "",
      });
      setShowModal(true);
      
      // Redirect after 4 seconds
      setTimeout(() => {
        router.push('/');
      }, 4000);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <>
      <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Share Your Feedback
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="type"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Feedback Type
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="general">General Feedback</option>
              <option value="bug">Bug Report</option>
              <option value="suggestion">Suggestion</option>
              <option value="compliment">Compliment</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="rating"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Rating
            </label>
            <div className="mt-1 flex items-center space-x-4">
              {[1, 2, 3, 4, 5].map((value) => (
                <label key={value} className="flex items-center">
                  <input
                    type="radio"
                    name="rating"
                    value={value}
                    checked={formData.rating === value.toString()}
                    onChange={handleChange}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">
                    {value}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="feedback"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Your Feedback
            </label>
            <textarea
              id="feedback"
              name="feedback"
              value={formData.feedback}
              onChange={handleChange}
              required
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Please share your thoughts..."
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Your Email (optional)
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="For follow-up questions (optional)"
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Submit Feedback
            </button>
          </div>
        </form>
      </div>
      <Modal 
        isOpen={showModal} 
        message="Thank you for your feedback! We appreciate your input."
      />
    </>
  );
};

export default FeedbackForm;

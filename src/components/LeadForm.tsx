"use client";

import { useState } from "react";

type LeadFormProps = {
  onSuccess?: () => void;
};

export default function LeadForm({ onSuccess }: LeadFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
    source: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const sourceOptions = [
    { value: "", label: "Select a source..." },
    { value: "website", label: "Website" },
    { value: "referral", label: "Referral" },
    { value: "linkedin", label: "LinkedIn" },
    { value: "google_ads", label: "Google Ads" },
    { value: "conference", label: "Conference" },
    { value: "cold_outreach", label: "Cold Outreach" },
    { value: "other", label: "Other" },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          const fieldErrors: Record<string, string> = {};
          for (const detail of data.details) {
            fieldErrors[detail.field] = detail.message;
          }
          setErrors(fieldErrors);
        } else {
          setErrors({ _form: data.error || "Something went wrong" });
        }
        return;
      }

      setSubmitSuccess(true);
      setFormData({ name: "", email: "", company: "", message: "", source: "" });
      onSuccess?.();
    } catch {
      setErrors({ _form: "Network error. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitSuccess) {
    return (
      <div className="rounded-lg bg-green-50 border border-green-200 p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-green-800">Thank you!</h3>
        <p className="mt-1 text-sm text-green-600">
          Your inquiry has been submitted. Our team will be in touch soon.
        </p>
        <button
          onClick={() => setSubmitSuccess(false)}
          className="mt-4 text-sm text-green-700 underline hover:text-green-800"
        >
          Submit another inquiry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errors._form && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3">
          <p className="text-sm text-red-700">{errors._form}</p>
        </div>
      )}

      <div>
        <label htmlFor="lead-name" className="block text-sm font-medium text-gray-700 mb-1">
          Full Name *
        </label>
        <input
          id="lead-name"
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
          placeholder="John Smith"
        />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="lead-email" className="block text-sm font-medium text-gray-700 mb-1">
          Email Address *
        </label>
        <input
          id="lead-email"
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
          placeholder="john@company.com"
        />
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="lead-company" className="block text-sm font-medium text-gray-700 mb-1">
          Company *
        </label>
        <input
          id="lead-company"
          type="text"
          required
          value={formData.company}
          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
          placeholder="Acme Inc."
        />
        {errors.company && <p className="mt-1 text-xs text-red-600">{errors.company}</p>}
      </div>

      <div>
        <label htmlFor="lead-source" className="block text-sm font-medium text-gray-700 mb-1">
          How did you hear about us? *
        </label>
        <select
          id="lead-source"
          required
          value={formData.source}
          onChange={(e) => setFormData({ ...formData, source: e.target.value })}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
        >
          {sourceOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {errors.source && <p className="mt-1 text-xs text-red-600">{errors.source}</p>}
      </div>

      <div>
        <label htmlFor="lead-message" className="block text-sm font-medium text-gray-700 mb-1">
          Message *
        </label>
        <textarea
          id="lead-message"
          required
          rows={4}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
          placeholder="Tell us about your needs..."
        />
        {errors.message && <p className="mt-1 text-xs text-red-600">{errors.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? "Submitting..." : "Submit Inquiry"}
      </button>
    </form>
  );
}

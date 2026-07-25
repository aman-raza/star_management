import Link from "next/link";
import LeadForm from "@/components/LeadForm";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Star Management</h1>
          </div>
          <Link
            href="/login"
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            Team Login
          </Link>
        </div>
      </header>

      {/* Hero + Lead Form */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left: Hero */}
          <div className="space-y-6">
            <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Let&apos;s grow your business together
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Tell us about your needs and our sales team will get back to you
              within 24 hours. We help companies streamline their operations
              with tailored solutions.
            </p>
            <div className="grid grid-cols-3 gap-6 pt-4">
              <div>
                <p className="text-3xl font-bold text-indigo-600">500+</p>
                <p className="text-sm text-gray-500 mt-1">Happy clients</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-indigo-600">98%</p>
                <p className="text-sm text-gray-500 mt-1">Satisfaction</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-indigo-600">24h</p>
                <p className="text-sm text-gray-500 mt-1">Response time</p>
              </div>
            </div>
          </div>

          {/* Right: Lead Form */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Get in touch
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Fill out the form below and we&apos;ll reach out shortly.
            </p>
            <LeadForm />
          </div>
        </div>
      </div>
    </div>
  );
}

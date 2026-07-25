"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="h-10 w-10 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold">S</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Sign in to Star Management</h1>
          <p className="mt-2 text-sm text-gray-500">
            Access the lead management dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400">
          Internal tool — contact your admin for access
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>}>
      <LoginForm />
    </Suspense>
  );
}

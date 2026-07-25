import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-gray-500">
          <Link
            href="https://digitalheroesco.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-500 transition-colors"
          >
            Built for Digital Heroes Training Task
          </Link>
        </p>
      </div>
    </footer>
  );
}

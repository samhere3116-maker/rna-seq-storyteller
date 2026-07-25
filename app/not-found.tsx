import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#090D16] text-white flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-4xl font-bold text-indigo-400 mb-2">404</h1>
      <h2 className="text-xl font-semibold mb-4">Page Not Found</h2>
      <p className="text-sm text-slate-400 max-w-md mb-6">
        The page or dataset view you requested could not be found.
      </p>
      <Link
        href="/"
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-lg transition-colors"
      >
        Return Home
      </Link>
    </div>
  );
}

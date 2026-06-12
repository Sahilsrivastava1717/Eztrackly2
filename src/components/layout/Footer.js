import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-white border-t border-gray-100">
      <div className="w-full py-10 px-6">
        <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between md:items-center">

          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold">
              <span className="text-gray-900">Ez</span>
              <span className="text-blue-600">Trackly</span>
            </h1>
            <p className="text-gray-400 text-sm">© 2026 EzTrackly</p>
          </div>

          <div className="flex items-center gap-8">
            <Link
              href="/auth"
              className="text-gray-500 hover:text-black text-sm transition-colors"
            >
              Sign in
            </Link>

            <Link
              href="#modules"
              className="text-gray-500 hover:text-black text-sm transition-colors"
            >
              Modules
            </Link>

            <Link
              href="#features"
              className="text-gray-500 hover:text-black text-sm transition-colors"
            >
              Features
            </Link>
          </div>

        </div>
      </div>
    </footer>
  );
}
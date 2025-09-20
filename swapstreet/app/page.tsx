import Link from "next/link";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-white">
      {/* Login Button */}
      <div className="absolute top-4 right-6">
        <Link href="/sign-in">
          <button
            className="rounded-xl px-5 py-2 font-semibold shadow-md transition 
                       bg-[#018571] text-white 
                       hover:bg-[#016c5d]"
          >
            Login
          </button>
        </Link>
      </div>

      {/* Title */}
      <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-[5rem]">
        Welcome to{" "}
        <span className="text-[hsl(280,100%,40%)]">SwapStreet!</span>
      </h1>
    </div>
  );
}

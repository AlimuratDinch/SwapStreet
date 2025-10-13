import Link from "next/link";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-white px-4">
      {/* Login Button */}
      <div className="absolute top-4 right-6">
        <Link href="/sign-in">
          <button
            className="rounded-xl px-4 sm:px-5 py-2 font-semibold shadow-md transition 
                       bg-[#018571] text-white 
                       hover:bg-[#016c5d] cursor-pointer text-sm sm:text-base"
          >
            Login
          </button>
        </Link>
      </div>

      

      {/* Title */}
      <h1
        className="text-center font-extrabold tracking-tight text-gray-900 
                   text-3xl sm:text-5xl md:text-6xl lg:text-7xl"
      >
        Welcome to <span className="text-[#e98b2a]">Swap</span>
        <span className="text-[#016c5d] italic">Street!</span>
      </h1>
    </div>
  );
}

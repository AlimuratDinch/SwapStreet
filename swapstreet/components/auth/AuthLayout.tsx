interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* Logo - Top Left */}
      <div className="fixed top-0 left-0 p-6 z-10">
        <h2 className="text-2xl font-bold">
          <span className="text-teal-600">SWAP</span>
          <span className="text-gray-900">STREET</span>
        </h2>
      </div>

      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center px-8 sm:px-12 lg:px-16 xl:px-24 py-12">
        {children}
      </div>

      {/* Right Side - Image & Text */}
      <div
        className="hidden lg:block lg:w-1/2 bg-cover bg-center relative"
        style={{ backgroundImage: 'url("/images/login&signup.jpg")' }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-teal-600/80 to-emerald-700/80 flex items-center justify-center">
          <div className="text-center text-white px-12 max-w-lg">
            <h2 className="text-4xl font-bold mb-4">
              Start Your Sustainable Fashion Journey
            </h2>
            <p className="text-lg text-white/90">
              Join thousands of fashion lovers buying and selling second-hand
              clothing while making a positive environmental impact.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

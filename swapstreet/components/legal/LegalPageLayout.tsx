import Link from "next/link";

interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  image?: {
    src: string;
    alt: string;
  };
  children: React.ReactNode;
}

export default function LegalPageLayout({
  title,
  lastUpdated,
  image,
  children,
}: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Header & Logo */}
      <header className="fixed top-0 w-full bg-white border-b border-gray-100 px-6 py-4 z-50">
        <Link
          href="/"
          className="inline-block text-2xl font-bold hover:opacity-80 transition-opacity cursor-pointer"
        >
          <span className="text-teal-600">SWAP</span>
          <span className="text-gray-900">STREET</span>
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 pt-24">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{title}</h1>
          <p className="text-gray-600 mb-8">Last Updated: {lastUpdated}</p>

          {/* image */}
          {image && (
            <div className="flex justify-center mb-8">
              <img
                src={image.src}
                alt={image.alt}
                className="w-60 h-60 object-contain"
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none text-justify">{children}</div>
      </main>

      {/* Footer */}
      <footer className="py-12 text-center text-muted-foreground mt-8 pt-8 border-t border-border">
        © 2025 SWAPSTREET. Made with ❤.
      </footer>
    </div>
  );
}

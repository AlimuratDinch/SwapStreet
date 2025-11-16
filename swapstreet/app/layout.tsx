import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";

export const metadata = {
  title: "SwapStreet",
  description: "***",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children} {/* Renders the content of each specific page */}
        </AuthProvider>
      </body>
    </html>
  );
}

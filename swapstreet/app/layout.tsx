import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { ChatProvider } from "../contexts/ChatContext";

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
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>
          <ChatProvider>
            {children}
          </ChatProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

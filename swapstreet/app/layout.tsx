import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { ChatProvider } from "../contexts/ChatContext";
import SessionGate from "../components/auth/SessionGate";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>
          <SessionGate>
            <ChatProvider>{children}</ChatProvider>
          </SessionGate>
        </AuthProvider>
      </body>
    </html>
  );
}

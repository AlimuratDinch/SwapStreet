"use client";
import { useAuth } from "../../contexts/AuthContext";

export default function SessionGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { authLoaded } = useAuth();

  if (!authLoaded) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white">
        {/* Added role="status" and aria-label for accessibility/testing */}
        <div
          role="status"
          aria-label="Loading"
          className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent"
        >
          <span className="sr-only">Checking session...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { isInitialized, accessToken } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isInitialized) return;

    if (!accessToken) {
      router.replace(`/login?from=${encodeURIComponent(pathname)}`);
    }
  }, [isInitialized, accessToken, pathname, router]);

  if (!accessToken) {
    return null;
  }

  return <>{children}</>;
};

export default RequireAuth;
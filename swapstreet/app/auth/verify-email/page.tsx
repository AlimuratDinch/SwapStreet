import { Suspense } from "react";
import VerifyEmailContent from "./verifyEmailContent";

export const dynamic = "force-dynamic";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
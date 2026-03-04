"use client";

import { Suspense } from "react";
import { Header } from "@/components/common/Header";
import ChatLayout from "./ChatLayout";

export default function ChatIndexPage() {
  return (
    <>
      <Header />
      <Suspense fallback={null}>
        <ChatLayout activeChatroomId={null} />
      </Suspense>
    </>
  );
}

"use client";

import React, { Suspense } from "react";
import { useParams } from "next/navigation";
import { Header } from "@/components/common/Header";
import ChatLayout from "../ChatLayout";

function ChatPageInner() {
  const params = useParams();
  const chatroomId = params.id as string;
  return <ChatLayout activeChatroomId={chatroomId} />;
}

export default function ChatPage() {
  return (
    <>
      <Header />
      <Suspense fallback={null}>
        <ChatPageInner />
      </Suspense>
    </>
  );
}

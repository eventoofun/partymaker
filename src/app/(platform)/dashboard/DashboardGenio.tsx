"use client";
import dynamic from "next/dynamic";

const GenioChatbot = dynamic(() => import("@/components/GenioChatbot"), { ssr: false });

export default function DashboardGenio() {
  return <GenioChatbot />;
}

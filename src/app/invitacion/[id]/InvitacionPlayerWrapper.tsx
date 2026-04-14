"use client";

import dynamic from "next/dynamic";
import type { InvitacionProps } from "@/components/InvitacionPlayer";

const InvitacionPlayer = dynamic(() => import("@/components/InvitacionPlayer"), { ssr: false });

export default function InvitacionPlayerWrapper({ inputProps }: { inputProps: InvitacionProps }) {
  return <InvitacionPlayer inputProps={inputProps} variant="full" />;
}

"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { esES } from "@clerk/localizations";

export default function ClerkWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      localization={esES}
      appearance={{
        variables: {
          colorPrimary: "#ff3366",
          colorBackground: "#15152e",
          colorInputBackground: "#1e1e38",
          colorText: "#ffffff",
          colorTextSecondary: "#8888a8",
          borderRadius: "12px",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}

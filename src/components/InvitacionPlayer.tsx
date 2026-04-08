"use client";

import { Player } from "@remotion/player";
import { InvitacionComposition, type InvitacionProps } from "@/remotion/InvitacionComposition";

// Remotion's Player `component` prop expects a loosely-typed FC;
// cast once here to avoid repetition.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Comp = InvitacionComposition as React.FC<any>;

interface Props {
  inputProps: InvitacionProps;
  /** compact = wizard preview (16:9 pequeño); full = página pública (9:16 pantalla completa) */
  variant?: "compact" | "full";
}

export default function InvitacionPlayer({ inputProps, variant = "compact" }: Props) {
  if (variant === "full") {
    return (
      <div style={{ width: "100%", height: "100dvh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Player
          component={Comp}
          inputProps={inputProps}
          durationInFrames={300}
          compositionWidth={1080}
          compositionHeight={1920}
          fps={30}
          style={{ height: "100dvh", aspectRatio: "9/16", maxWidth: "100vw" }}
          autoPlay
          loop
          controls={false}
          clickToPlay={false}
        />
      </div>
    );
  }

  return (
    <Player
      component={Comp}
      inputProps={inputProps}
      durationInFrames={300}
      compositionWidth={1080}
      compositionHeight={1920}
      fps={30}
      style={{ width: "100%", aspectRatio: "9/16", borderRadius: "16px", overflow: "hidden" }}
      autoPlay
      loop
      controls
      clickToPlay
    />
  );
}

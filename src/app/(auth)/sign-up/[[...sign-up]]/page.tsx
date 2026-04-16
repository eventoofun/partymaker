import { SignUp } from "@clerk/nextjs";

interface Props {
  searchParams: Promise<{ pack?: string }>;
}

const PACK_REDIRECT: Record<string, string> = {
  gratis:    "/dashboard/eventos/nuevo",
  video:     "/dashboard/eventos/nuevo?wizard=video",
  avatar:    "/dashboard/eventos/nuevo?wizard=avatar",
  estrella:  "/dashboard/eventos/nuevo?wizard=estrella",
};

export default async function SignUpPage({ searchParams }: Props) {
  const { pack } = await searchParams;
  const redirectUrl = (pack && PACK_REDIRECT[pack]) ?? "/dashboard";

  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--gradient-radial)",
      padding: "24px",
    }}>
      <SignUp forceRedirectUrl={redirectUrl} />
    </div>
  );
}

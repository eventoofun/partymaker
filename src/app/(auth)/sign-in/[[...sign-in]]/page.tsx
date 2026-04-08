import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--gradient-radial)",
      padding: "24px",
    }}>
      <SignIn />
    </div>
  );
}

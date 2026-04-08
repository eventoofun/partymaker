import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--gradient-radial)",
      padding: "24px",
    }}>
      <SignUp />
    </div>
  );
}

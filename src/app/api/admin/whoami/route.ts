import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  const adminId = process.env.ADMIN_USER_ID;
  return NextResponse.json({
    userId: userId || null,
    adminId: adminId ? adminId.slice(0, 8) + "…" : null,
    match: userId === adminId,
  });
}

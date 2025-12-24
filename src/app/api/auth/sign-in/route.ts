import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";
import { z } from "zod";

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = signInSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { email, password } = result.data;

    const user = await prisma.user.findUnique({ 
      where: { email },
      include: { role: true }
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Create session
    await createSession(user.id);
    
    const roleName = user.role?.name || user.userRole.toLowerCase();

    return NextResponse.json({ success: true, user: { id: user.id, email: user.email, role: roleName } });
  } catch (error) {
    console.error("Sign in error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

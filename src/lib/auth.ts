import { hash, compare } from "bcryptjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { signToken, verifyToken } from "@/lib/jwt";

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return compare(password, hash);
}

export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  // Get user role for the token
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });
  
  const roleName = user?.role?.name || user?.userRole?.toLowerCase() || "patient";

  const token = await signToken({ userId, role: roleName }, "7d");

  // Create session in DB
  const session = await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  // Set cookie
  (await cookies()).set("session", session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });

  return session;
}

export { verifyToken };

export async function getSession() {
  const token = (await cookies()).get("session")?.value;
  if (!token) return null;

  try {
    const payload = await verifyToken(token);
    if (!payload) return null;

    const userId = payload.userId as string;

    // Verify session exists in DB and hasn't expired
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: { include: { role: true } } },
    });

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    return session;
  } catch (error) {
    return null;
  }
}

export async function deleteSession() {
  const token = (await cookies()).get("session")?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }
  (await cookies()).delete("session");
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

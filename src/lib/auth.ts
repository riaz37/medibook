import { hash, compare } from "bcryptjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { signToken, verifyToken } from "@/lib/jwt";
import crypto from "crypto";

// Token configuration
const ACCESS_TOKEN_EXPIRY = "15m"; // 15 minutes
const REFRESH_TOKEN_EXPIRY_DAYS = 7; // 7 days
const SESSION_EXPIRY_DAYS = 7; // 7 days for backward compatibility

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return compare(password, hash);
}

/**
 * Generate a secure random token family ID for refresh token rotation
 */
function generateTokenFamily(): string {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Create a new session with access and refresh tokens
 * Implements refresh token rotation for enhanced security
 */
export async function createSession(userId: string) {
  const sessionExpiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  const refreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  
  // Get user role for the token
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });
  
  const roleName = user?.role?.name || user?.userRole?.toLowerCase() || "patient";

  // Create access token (short-lived)
  const accessToken = await signToken({ userId, role: roleName, type: "access" }, ACCESS_TOKEN_EXPIRY);
  
  // Create refresh token (long-lived)
  const refreshTokenValue = crypto.randomBytes(32).toString("hex");
  const tokenFamily = generateTokenFamily();
  
  // Create session in DB (for backward compatibility)
  const session = await prisma.session.create({
    data: {
      userId,
      token: accessToken,
      expiresAt: sessionExpiresAt,
    },
  });

  // Create refresh token in DB
  await prisma.refreshToken.create({
    data: {
      userId,
      token: refreshTokenValue,
      family: tokenFamily,
      expiresAt: refreshExpiresAt,
    },
  });

  const cookieStore = await cookies();
  
  // Set access token cookie (short-lived)
  cookieStore.set("session", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: sessionExpiresAt,
    sameSite: "lax",
    path: "/",
  });

  // Set refresh token cookie (long-lived, more restrictive)
  cookieStore.set("refresh_token", refreshTokenValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: refreshExpiresAt,
    sameSite: "strict",
    path: "/api/auth", // Only sent to auth endpoints
  });

  return { session, accessToken, refreshToken: refreshTokenValue };
}

/**
 * Refresh the access token using a valid refresh token
 * Implements token rotation - each refresh token can only be used once
 */
export async function refreshAccessToken(refreshTokenValue: string) {
  // Find the refresh token
  const refreshToken = await prisma.refreshToken.findUnique({
    where: { token: refreshTokenValue },
    include: { user: { include: { role: true } } },
  });

  if (!refreshToken) {
    return { error: "Invalid refresh token" };
  }

  // Check if token has been revoked (potential token theft detected)
  if (refreshToken.revokedAt) {
    // Token reuse detected! Revoke all tokens in this family
    await prisma.refreshToken.updateMany({
      where: { family: refreshToken.family },
      data: { revokedAt: new Date() },
    });
    
    // Also invalidate all sessions for this user
    await prisma.session.deleteMany({
      where: { userId: refreshToken.userId },
    });
    
    return { error: "Token reuse detected. All sessions invalidated for security." };
  }

  // Check if token has expired
  if (refreshToken.expiresAt < new Date()) {
    return { error: "Refresh token expired" };
  }

  const user = refreshToken.user;
  const roleName = user?.role?.name || user?.userRole?.toLowerCase() || "patient";

  // Create new access token
  const newAccessToken = await signToken(
    { userId: user.id, role: roleName, type: "access" },
    ACCESS_TOKEN_EXPIRY
  );

  // Create new refresh token (rotation)
  const newRefreshTokenValue = crypto.randomBytes(32).toString("hex");
  const newRefreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  // Revoke the old refresh token and create new one in a transaction
  const newRefreshToken = await prisma.$transaction(async (tx) => {
    // Mark old token as revoked and point to new token
    await tx.refreshToken.update({
      where: { id: refreshToken.id },
      data: { revokedAt: new Date() },
    });

    // Create new refresh token in the same family
    return tx.refreshToken.create({
      data: {
        userId: user.id,
        token: newRefreshTokenValue,
        family: refreshToken.family, // Same family for rotation detection
        expiresAt: newRefreshExpiresAt,
      },
    });
  });

  // Update the session with the new access token
  const sessionExpiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.updateMany({
    where: { userId: user.id },
    data: { token: newAccessToken, expiresAt: sessionExpiresAt },
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshTokenValue,
    user: {
      id: user.id,
      email: user.email,
      role: roleName,
    },
  };
}

export { verifyToken };

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
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
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  const refreshToken = cookieStore.get("refresh_token")?.value;

  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }

  if (refreshToken) {
    // Get the refresh token to find the family
    const rt = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });
    
    if (rt) {
      // Revoke all tokens in the family
      await prisma.refreshToken.updateMany({
        where: { family: rt.family },
        data: { revokedAt: new Date() },
      });
    }
  }

  cookieStore.delete("session");
  cookieStore.delete("refresh_token");
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

/**
 * Revoke all refresh tokens for a user (e.g., on password change)
 */
export async function revokeAllUserTokens(userId: string) {
  await prisma.$transaction([
    prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
    prisma.session.deleteMany({
      where: { userId },
    }),
  ]);
}

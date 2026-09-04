import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

const SECRET = process.env.JWT_SECRET || "dev-only-secret-change-me";
export const ADMIN_COOKIE = "flexhome_admin";
export const USER_COOKIE = "flexhome_user";

export function signAdminToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: "7d" });
}

export function verifyAdminToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

export function signUserToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: "30d" });
}

export function verifyUserToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

export async function checkPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

// Shared by every route that completes a buyer sign-in/sign-up (password,
// OTP, or a clicked email-verification link) so the cookie is always set
// the same way.
export function attachSessionCookie(response, user) {
  response.cookies.set(USER_COOKIE, signUserToken(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return response;
}

export function createSessionResponse(user, body = { authenticated: true }) {
  return attachSessionCookie(NextResponse.json(body), user);
}

// A phone-only (OTP) account has no password to check, but password_hash
// is NOT NULL, so it gets an unusable random hash instead of a schema
// migration — nothing ever authenticates against it.
export async function randomPasswordHash() {
  return hashPassword(Math.random().toString(36) + Date.now());
}

// Fallback demo credentials, used only if there is no admin user row in
// MySQL yet (so the admin panel is explorable before you've seeded users).
export const DEMO_ADMIN = {
  email: "admin@flexhome.com",
  password: "admin123",
};

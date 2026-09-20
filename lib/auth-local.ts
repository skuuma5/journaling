import { cookies } from "next/headers";

const AUTH_COOKIE = "local-session";

export function setLocalSession(userId: string) {
  cookies().set(AUTH_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: "/",
  });
}

export function getLocalSession() {
  return cookies().get(AUTH_COOKIE)?.value;
}

export function clearLocalSession() {
  cookies().delete(AUTH_COOKIE);
}

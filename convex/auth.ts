import { jwtVerify } from "jose";

export async function verifyToken(token: string) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET missing in Convex environment variables");
  try {
    const key = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
    return payload;
  } catch (e) {
    return null;
  }
}

export async function requireAdmin(token?: string) {
  if (!token) throw new Error("Unauthorized: No token provided");
  const payload = await verifyToken(token);
  if (!payload || payload.role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required");
  }
  return payload;
}

export async function requireUser(token?: string) {
  if (!token) throw new Error("Unauthorized: No token provided");
  const payload = await verifyToken(token);
  if (!payload) {
    throw new Error("Unauthorized: Invalid token");
  }
  return payload;
}

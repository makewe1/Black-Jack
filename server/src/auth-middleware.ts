import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { query } from "./db.js";

const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_ME_SECRET";

type TokenPayload = {
  id?: string;
  email?: string;
  iat?: number;
  exp?: number;
};

export type AuthenticatedUser = {
  id: string;
  email: string;
};

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

async function lookupUserByEmail(email: string): Promise<AuthenticatedUser | null> {
  const { rows } = await query(
    "select id, email from users where lower(email) = lower($1)",
    [email],
  );
  if (!rows[0]) return null;
  return { id: rows[0].id, email: rows[0].email };
}

async function verifyToken(token: string): Promise<AuthenticatedUser | null> {
  const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
  if (!decoded?.email) return null;

  if (decoded.id) {
    return { id: decoded.id, email: decoded.email };
  }

  return lookupUserByEmail(decoded.email);
}

function extractBearer(header: string | undefined): string | null {
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = extractBearer(req.headers.authorization);
  if (!token) return next();

  try {
    const user = await verifyToken(token);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    req.user = user;
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = extractBearer(req.headers.authorization);
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const user = await verifyToken(token);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    req.user = user;
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}
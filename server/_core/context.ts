import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { COOKIE_NAME } from "@shared/const";

import { getDb } from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  db: Awaited<ReturnType<typeof getDb>>;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  const cookieHeader = opts.req.headers.cookie ?? "";
  const hasSessionCookie =
    cookieHeader.includes(`${COOKIE_NAME}=`) ||
    cookieHeader.includes(`${COOKIE_NAME}%3D`);

  if (hasSessionCookie) {
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch {
      // اختياري: لا تطبع أخطاء هنا حتى لا يزعجك في dev
      user = null;
    }
  }

  const db = await getDb();

  return {
    req: opts.req,
    res: opts.res,
    user,
    db,
  };
}
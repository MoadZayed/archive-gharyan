import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET?.trim();
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is missing. Set it in .env (no quotes, no trailing spaces).");
}
const JWT_SECRET_SAFE = JWT_SECRET as string;

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcryptjs.genSalt(12);
  return bcryptjs.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}

export function generateToken(studentID: string, studentDbId: number | string, role: string = 'student', expiresIn: string = "180d"): string {
  return jwt.sign({ studentID, studentDbId, role }, JWT_SECRET_SAFE, {
    expiresIn,
  } as jwt.SignOptions);
}

export function verifyToken(
  token: string
): { studentID: string; studentDbId: number | string; role: string } | null {
  try {
    const result = jwt.verify(token, JWT_SECRET_SAFE) as any;
    return {
      studentID: result.studentID,
      studentDbId: result.studentDbId,
      role: result.role || 'student'
    };
  } catch {
    return null;
  }
}

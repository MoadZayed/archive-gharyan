import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
} from "./auth";

describe("Authentication", () => {
  describe("Password hashing", () => {
    it("should hash a password", async () => {
      const password = "test123";
      const hash = await hashPassword(password);
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
    });

    it("should verify a correct password", async () => {
      const password = "test123";
      const hash = await hashPassword(password);
      expect(await verifyPassword(password, hash)).toBe(true);
    });

    it("should reject an incorrect password", async () => {
      const password = "test123";
      const wrongPassword = "wrong123";
      const hash = await hashPassword(password);
      expect(await verifyPassword(wrongPassword, hash)).toBe(false);
    });

    it("should produce different salts per hash", async () => {
      const password = "test123";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      expect(hash1).not.toBe(hash2);
      expect(await verifyPassword(password, hash1)).toBe(true);
      expect(await verifyPassword(password, hash2)).toBe(true);
    });
  });

  describe("JWT tokens", () => {
    it("should generate a token", () => {
      const token = generateToken("student123", 1);
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
    });

    it("should verify a valid token", () => {
      const studentID = "student123";
      const studentDbId = 1;
      const token = generateToken(studentID, studentDbId);
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.studentID).toBe(studentID);
      expect(decoded?.studentDbId).toBe(studentDbId);
    });

    it("should reject an invalid token", () => {
      const decoded = verifyToken("invalid.token.here");
      expect(decoded).toBeNull();
    });

    it("should reject an expired token", () => {
      const decoded = verifyToken("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature");
      expect(decoded).toBeNull();
    });
  });
});

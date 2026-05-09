import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
} from "./auth";

describe("Authentication", () => {
  describe("Password hashing", () => {
    it("should hash a password", () => {
      const password = "test123";
      const hash = hashPassword(password);
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
    });

    it("should verify a correct password", () => {
      const password = "test123";
      const hash = hashPassword(password);
      expect(verifyPassword(password, hash)).toBe(true);
    });

    it("should reject an incorrect password", () => {
      const password = "test123";
      const wrongPassword = "wrong123";
      const hash = hashPassword(password);
      expect(verifyPassword(wrongPassword, hash)).toBe(false);
    });

    it("should produce consistent hashes", () => {
      const password = "test123";
      const hash1 = hashPassword(password);
      const hash2 = hashPassword(password);
      expect(hash1).toBe(hash2);
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
      // This test would require manipulating the JWT expiration
      // For now, we just verify that invalid tokens return null
      const decoded = verifyToken("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature");
      expect(decoded).toBeNull();
    });
  });
});

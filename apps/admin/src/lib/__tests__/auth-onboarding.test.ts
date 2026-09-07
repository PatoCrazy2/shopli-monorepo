import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  checkPasswordRules,
  isDisposableEmail,
  suggestEmailDomain,
  checkEmailMxRecord,
} from "../validators/auth";

describe("Auth & Onboarding - Pruebas Unitarias", () => {
  describe("checkPasswordRules", () => {
    it("debe rechazar contraseñas con menos de 8 caracteres", () => {
      const result = checkPasswordRules("Abc1");
      expect(result.hasMinLength).toBe(false);
      expect(result.isValid).toBe(false);
    });

    it("debe rechazar contraseñas sin números", () => {
      const result = checkPasswordRules("Abcdefghijk");
      expect(result.hasNumber).toBe(false);
      expect(result.isValid).toBe(false);
    });

    it("debe rechazar contraseñas sin letras", () => {
      const result = checkPasswordRules("1234567890");
      expect(result.hasLetter).toBe(false);
      expect(result.isValid).toBe(false);
    });

    it("debe aceptar contraseñas que cumplan todos los requisitos (>=8 chars, 1 letra, 1 número)", () => {
      const result = checkPasswordRules("ShopliSecure2026");
      expect(result.hasMinLength).toBe(true);
      expect(result.hasNumber).toBe(true);
      expect(result.hasLetter).toBe(true);
      expect(result.isValid).toBe(true);
    });
  });

  describe("isDisposableEmail", () => {
    it("debe identificar correos temporales conocidos", () => {
      expect(isDisposableEmail("usuario@mailinator.com")).toBe(true);
      expect(isDisposableEmail("test@tempmail.com")).toBe(true);
      expect(isDisposableEmail("spam@10minutemail.com")).toBe(true);
      expect(isDisposableEmail("cuenta@yopmail.com")).toBe(true);
    });

    it("debe permitir dominios comerciales legítimos", () => {
      expect(isDisposableEmail("contacto@tienda.com")).toBe(false);
      expect(isDisposableEmail("admin@gmail.com")).toBe(false);
      expect(isDisposableEmail("gerencia@outlook.com")).toBe(false);
      expect(isDisposableEmail("ventas@empresa.mx")).toBe(false);
    });
  });

  describe("suggestEmailDomain", () => {
    it("debe sugerir corrección ante errores tipográficos comunes", () => {
      expect(suggestEmailDomain("usuario@gmai.com")).toBe("usuario@gmail.com");
      expect(suggestEmailDomain("ventas@gamil.com")).toBe("ventas@gmail.com");
      expect(suggestEmailDomain("admin@hotmial.com")).toBe("admin@hotmail.com");
      expect(suggestEmailDomain("contacto@outlok.com")).toBe("contacto@outlook.com");
    });

    it("debe retornar null para correos bien escritos", () => {
      expect(suggestEmailDomain("usuario@gmail.com")).toBeNull();
      expect(suggestEmailDomain("admin@empresa.com")).toBeNull();
    });
  });

  describe("checkEmailMxRecord", () => {
    it("debe rechazar correos con dominios en la lista de desechables sin hacer consulta de red", async () => {
      const result = await checkEmailMxRecord("test@mailinator.com");
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("desechable no permitido");
    });

    it("debe rechazar correos con formato inválido", async () => {
      const result = await checkEmailMxRecord("correo-sin-arroba");
      expect(result.valid).toBe(false);
    });
  });
});

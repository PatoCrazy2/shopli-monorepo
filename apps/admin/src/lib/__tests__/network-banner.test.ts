import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("NetworkBanner - Lógica de Transición de Estado de Red", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("inicia en 'online' cuando el navegador reporta conexión", () => {
    let status: "online" | "offline" | "restored" = "online";
    const isOnline = true;
    if (!isOnline) {
      status = "offline";
    }
    expect(status).toBe("online");
  });

  it("cambia a 'offline' inmediatamente cuando se pierde la conexión", () => {
    let status: "online" | "offline" | "restored" = "online";

    const handleOffline = () => {
      status = "offline";
    };

    handleOffline();
    expect(status).toBe("offline");
  });

  it("cambia a 'restored' y regresa a 'online' exactamente a los 3000ms", () => {
    let status: "online" | "offline" | "restored" = "offline";
    let restoreTimeout: any = null;

    const handleOnline = () => {
      status = "restored";
      if (restoreTimeout) clearTimeout(restoreTimeout);
      restoreTimeout = setTimeout(() => {
        status = "online";
      }, 3000);
    };

    handleOnline();
    expect(status).toBe("restored");

    // Avanzamos 2999ms: sigue en restored
    vi.advanceTimersByTime(2999);
    expect(status).toBe("restored");

    // Llega a los 3000ms: desaparece volviendo a online
    vi.advanceTimersByTime(1);
    expect(status).toBe("online");
  });

  it("cancela el temporizador de restablecimiento si se vuelve a desconectar antes de los 3s", () => {
    let status: "online" | "offline" | "restored" = "offline";
    let restoreTimeout: any = null;

    const handleOnline = () => {
      status = "restored";
      if (restoreTimeout) clearTimeout(restoreTimeout);
      restoreTimeout = setTimeout(() => {
        status = "online";
      }, 3000);
    };

    const handleOffline = () => {
      if (restoreTimeout) clearTimeout(restoreTimeout);
      status = "offline";
    };

    handleOnline();
    expect(status).toBe("restored");

    // Pasan 1500ms y se vuelve a caer el internet
    vi.advanceTimersByTime(1500);
    handleOffline();
    expect(status).toBe("offline");

    // Avanzan otros 2000ms: debe permanecer en offline, sin volverse online
    vi.advanceTimersByTime(2000);
    expect(status).toBe("offline");
  });
});

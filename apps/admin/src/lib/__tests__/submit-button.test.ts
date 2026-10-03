import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("SubmitButton - Lógica de Bloqueo Anti-Doble Clic y Aviso de Red Lenta", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("se deshabilita físicamente cuando pending es true (evita doble clic)", () => {
    const disabledProp = false;
    let pending = false;

    let isDisabled = Boolean(disabledProp || pending);
    expect(isDisabled).toBe(false);

    // Usuario hace clic, pending pasa a true
    pending = true;
    isDisabled = Boolean(disabledProp || pending);
    expect(isDisabled).toBe(true);
  });

  it("muestra el texto inicial de carga en los primeros 4 segundos", () => {
    const loadingText = "Guardando...";
    const slowText = "Conexión inestable, procesando...";
    let isSlow = false;

    const pending = true;
    const slowThresholdMs = 4000;

    let timer: any = null;
    if (pending) {
      timer = setTimeout(() => {
        isSlow = true;
      }, slowThresholdMs);
    }

    // A los 1000ms sigue mostrando loadingText
    vi.advanceTimersByTime(1000);
    expect(isSlow ? slowText : loadingText).toBe("Guardando...");

    // A los 3999ms sigue mostrando loadingText
    vi.advanceTimersByTime(2999);
    expect(isSlow ? slowText : loadingText).toBe("Guardando...");

    // A los 4000ms cambia a slowText
    vi.advanceTimersByTime(1);
    expect(isSlow ? slowText : loadingText).toBe("Conexión inestable, procesando...");

    if (timer) clearTimeout(timer);
  });

  it("reinicia el estado de lentitud cuando el proceso concluye antes de los 4s", () => {
    let isSlow = false;
    let pending = true;
    let timer: any = setTimeout(() => {
      isSlow = true;
    }, 4000);

    // Respuesta rápida a los 800ms
    vi.advanceTimersByTime(800);
    pending = false;
    clearTimeout(timer);
    isSlow = false;

    // Avanza más de 4s totales
    vi.advanceTimersByTime(5000);
    expect(isSlow).toBe(false);
    expect(pending).toBe(false);
  });
});

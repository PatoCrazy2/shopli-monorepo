import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Etapa 3: PWA Offline Fallback y Service Worker v3", () => {
  it("el archivo offline.html existe en public y contiene el título y botón de reintentar", () => {
    const offlineHtmlPath = path.resolve(__dirname, "../../../public/offline.html");
    expect(fs.existsSync(offlineHtmlPath)).toBe(true);

    const content = fs.readFileSync(offlineHtmlPath, "utf-8");
    expect(content).toContain("Sin conexión");
    expect(content).toContain("Reintentar");
    expect(content).toContain("window.location.reload()");
    expect(content).toContain("/shopli_snbg.svg");
    // Verifica que el tamaño del logo esté acotado
    expect(content).toContain("width: 36px");
  });

  it("el service worker sw.js está en versión v3 y precachea /offline.html", () => {
    const swPath = path.resolve(__dirname, "../../../public/sw.js");
    expect(fs.existsSync(swPath)).toBe(true);

    const content = fs.readFileSync(swPath, "utf-8");
    expect(content).toContain('const CACHE_NAME = "shopli-admin-v3";');
    expect(content).toContain('"/offline.html"');
    expect(content).toContain('caches.match("/offline.html")');
  });

  it("la página /offline en App Router está creada", () => {
    const offlinePagePath = path.resolve(__dirname, "../../app/offline/page.tsx");
    expect(fs.existsSync(offlinePagePath)).toBe(true);

    const content = fs.readFileSync(offlinePagePath, "utf-8");
    expect(content).toContain("Sin conexión");
    expect(content).toContain("Reintentar");
  });
});

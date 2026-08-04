// Cliente de lectura del API publico de Source Library.
// Todo se ejecuta en el servidor (Server Components de Next.js): por eso no hay
// problema de CORS y el cache ISR evita repetir llamadas en cada visita.

export const SL_BASE = process.env.SL_API_BASE || "https://sourcelibrary.org";
const DEFAULT_REVALIDATE = Number(process.env.SL_REVALIDATE || 3600);

export function qs(params) {
  const sp = new URLSearchParams();
  const src = params || {};
  for (const key of Object.keys(src)) {
    const value = src[key];
    if (value === undefined || value === null || value === "") continue;
    sp.set(key, String(value));
  }
  const out = sp.toString();
  return out ? "?" + out : "";
}

async function slFetch(path, revalidate) {
  const headers = { accept: "application/json" };
  if (process.env.SL_API_KEY) {
    headers.authorization = "Bearer " + process.env.SL_API_KEY;
  }
  const res = await fetch(SL_BASE + path, {
    headers: headers,
    next: { revalidate: revalidate === undefined ? DEFAULT_REVALIDATE : revalidate },
  });
  const raw = await res.text();
  if (!res.ok) {
    const err = new Error("API " + res.status + " en " + path);
    err.status = res.status;
    err.body = raw.slice(0, 600);
    throw err;
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    const err = new Error("Respuesta no JSON en " + path);
    err.status = res.status;
    throw err;
  }
}

// Envuelve una promesa: si falla devuelve un valor de reserva en vez de romper la pagina.
export async function safe(promise, fallback) {
  try {
    return await promise;
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[sl]", e.status || "", e.message);
    }
    return fallback === undefined ? null : fallback;
  }
}

/* ---------- Catalogo ---------- */
export function listBooks(params) {
  return slFetch("/api/books/library" + qs(params));
}
export function getBook(id) {
  return slFetch("/api/books/" + encodeURIComponent(id));
}
export function getCollections() {
  return slFetch("/api/collections" + qs({ limit: 60 }));
}

/* ---------- Texto y busqueda ---------- */
export function getText(id, from, to) {
  return slFetch(
    "/api/books/" + encodeURIComponent(id) + "/text" + qs({ from: from, to: to, content: "both" }),
    1800
  );
}
export function searchInBook(id, query) {
  return slFetch("/api/books/" + encodeURIComponent(id) + "/search" + qs({ q: query }), 600);
}
export function searchAll(query, limit) {
  return slFetch("/api/search" + qs({ q: query, limit: limit || 24 }), 1800);
}

/* ---------- Citas y versiones (ediciones) ---------- */
export function getQuote(id, page) {
  return slFetch("/api/books/" + encodeURIComponent(id) + "/quote" + qs({ page: page }));
}
export function getEditions(id) {
  return slFetch("/api/books/" + encodeURIComponent(id) + "/editions");
}

/* ---------- Galeria ---------- */
export function getGallery(params) {
  return slFetch("/api/gallery" + qs(params));
}

/* ---------- Imagenes: las pide el navegador, no pasan por fetch ---------- */
export function proxyImage(url, width) {
  if (!url) return null;
  return SL_BASE + "/api/image" + qs({ url: url, w: width || 1200 });
}
export function pageImage(bookId, pageNumber, tier) {
  const n = String(pageNumber).padStart(4, "0");
  const suffix = tier === "thumb" ? "-thumb" : tier === "full" ? "-full" : "";
  return "https://images.sourcelibrary.org/pages/" + bookId + "/" + n + suffix + ".jpg";
}

/* Primer valor no vacio de una lista de candidatos */
export function pick() {
  for (const v of arguments) {
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return null;
}

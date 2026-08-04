import { getGallery, safe, proxyImage } from "../../lib/sl";

export const revalidate = 3600;
export const metadata = { title: "Galeria - Mi Biblioteca" };

export default async function Galeria({ searchParams }) {
  const sp = (await searchParams) || {};
  const q = String(sp.q || "").trim();
  const data = await safe(getGallery({ limit: 48, query: q }), { items: [] });
  const items = (data && data.items ? data.items : []).filter((it) => it && it.imageUrl);

  return (
    <>
      <h1>Galeria de ilustraciones</h1>
      <p className="lead">
        Grabados, diagramas y emblemas detectados dentro de los libros. Cada imagen conserva su procedencia:
        libro, autor, ano y numero de pagina, con enlace directo al lector.
      </p>

      <form action="/galeria" className="row" style={{ margin: "16px 0", alignItems: "center" }}>
        <input
          name="q"
          defaultValue={q}
          placeholder="dragon, athanor, zodiaco, arbol..."
          aria-label="Buscar en la galeria"
          style={{ flex: "1 1 300px", padding: "10px 12px", borderRadius: 8, border: "1px solid #2e2c3c", background: "#1f1e2a", color: "#ece9f5", fontFamily: "inherit" }}
        />
        <button type="submit">Buscar</button>
      </form>

      {!items.length && <p className="warn">Sin imagenes para esa consulta.</p>}

      <div className="grid">
        {items.map((it) => (
          <a
            className="card"
            key={(it.pageId || "") + "-" + (it.detectionIndex != null ? it.detectionIndex : 0)}
            href={"/libro/" + encodeURIComponent(it.bookId) + "/leer?p=" + (it.pageNumber || 1)}
          >
            <img src={proxyImage(it.imageUrl, 600)} alt={it.description ? String(it.description).slice(0, 120) : "Ilustracion"} loading="lazy" />
            <div className="cardBody">
              <h3>{it.bookTitle || "Sin titulo"}</h3>
              <p className="meta">{[it.author, it.year].filter(Boolean).join(" - ")}</p>
              <p className="meta">Pagina {it.pageNumber}</p>
              {it.description && (
                <p className="meta" style={{ marginTop: 6 }}>{String(it.description).slice(0, 180)}</p>
              )}
            </div>
          </a>
        ))}
      </div>
    </>
  );
}

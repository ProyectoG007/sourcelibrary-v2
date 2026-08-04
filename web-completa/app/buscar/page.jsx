import { listBooks, searchAll, safe } from "../../lib/sl";
import { BookCard } from "../page";

export const revalidate = 1800;
export const metadata = { title: "Buscar - Mi Biblioteca" };

const IDIOMAS = ["", "Latin", "German", "French", "English", "Italian", "Dutch", "Greek", "Arabic"];

export default async function Buscar({ searchParams }) {
  const sp = (await searchParams) || {};
  const q = String(sp.q || "").trim();
  const modo = sp.modo === "texto" ? "texto" : "catalogo";
  const idioma = String(sp.idioma || "");

  let catalogo = { books: [], total: 0 };
  let texto = null;
  if (q && modo === "catalogo") {
    catalogo = await safe(
      listBooks({ search: q, limit: 36, has_translation: true, language: idioma }),
      { books: [], total: 0 }
    );
  }
  if (q && modo === "texto") {
    texto = await safe(searchAll(q, 30), null);
  }

  return (
    <>
      <h1>Buscar</h1>
      <form className="row" action="/buscar" style={{ margin: "16px 0", alignItems: "center" }}>
        <input
          name="q"
          defaultValue={q}
          placeholder="alchemy, quintessence, Paracelsus..."
          aria-label="Consulta"
          style={{
            flex: "1 1 320px",
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #2e2c3c",
            background: "#1f1e2a",
            color: "#ece9f5",
            fontFamily: "inherit",
          }}
        />
        <select name="modo" defaultValue={modo} aria-label="Modo" style={{ padding: 9, borderRadius: 8, background: "#1f1e2a", color: "#ece9f5", border: "1px solid #2e2c3c" }}>
          <option value="catalogo">Catalogo (titulo y autor)</option>
          <option value="texto">Texto completo (traducciones)</option>
        </select>
        <select name="idioma" defaultValue={idioma} aria-label="Idioma" style={{ padding: 9, borderRadius: 8, background: "#1f1e2a", color: "#ece9f5", border: "1px solid #2e2c3c" }}>
          {IDIOMAS.map((l) => (
            <option key={l || "todos"} value={l}>{l || "Todos los idiomas"}</option>
          ))}
        </select>
        <button type="submit">Buscar</button>
      </form>

      {!q && (
        <p className="lead">
          El modo <b>catalogo</b> filtra por titulo y autor (rapido). El modo <b>texto completo</b> consulta
          el indice de traducciones del servidor y puede tardar unos segundos; devuelve libros donde
          aparece la expresion, no paginas sueltas.
        </p>
      )}

      {q && modo === "catalogo" && (
        <>
          <h2>{(catalogo.total || 0).toLocaleString("es")} resultados en el catalogo</h2>
          <div className="grid">
            {(catalogo.books || []).map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
          {!(catalogo.books || []).length && <p className="warn">Sin resultados para esa consulta.</p>}
        </>
      )}

      {q && modo === "texto" && (
        <>
          <h2>Texto completo: {texto ? (texto.total || 0).toLocaleString("es") : 0} coincidencias</h2>
          {!texto && <p className="error">La busqueda de texto no respondio. Intenta de nuevo en un momento.</p>}
          {texto && (texto.results || []).map((r) => (
            <div className="panel" key={r.id || r.bookId} style={{ marginBottom: 12 }}>
              <h3>
                <a href={"/libro/" + encodeURIComponent(r.slug || r.id || r.bookId)}>
                  {r.display_title || r.title || "Sin titulo"}
                </a>
              </h3>
              <p className="meta">{[r.author, r.published, r.language].filter(Boolean).join(" - ")}</p>
              {r.snippet && <p style={{ fontSize: 15 }}>{String(r.snippet).slice(0, 400)}</p>}
              <p className="meta">
                <a href={"/libro/" + encodeURIComponent(r.slug || r.id || r.bookId) + "/leer?q=" + encodeURIComponent(q)}>
                  Buscar esta expresion dentro del libro
                </a>
              </p>
            </div>
          ))}
          {texto && !(texto.results || []).length && <p className="warn">Sin coincidencias en las traducciones.</p>}
        </>
      )}
    </>
  );
}

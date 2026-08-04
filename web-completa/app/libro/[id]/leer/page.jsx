import { getBook, getText, getQuote, searchInBook, safe, pageImage, proxyImage } from "../../../../lib/sl";

export const revalidate = 1800;

export default async function Leer({ params, searchParams }) {
  const p = (await params) || {};
  const sp = (await searchParams) || {};
  const id = p.id;
  const pagina = Math.max(1, parseInt(sp.p || "1", 10) || 1);
  const q = String(sp.q || "").trim();

  const book = await safe(getBook(id));
  if (!book) {
    return (
      <>
        <h1>Lector</h1>
        <p className="error">No se pudo cargar el libro <b>{id}</b>.</p>
      </>
    );
  }

  const bookId = book.id || book._id || id;
  const slug = book.slug || bookId;
  const total = book.pages_count || 0;
  const base = "/libro/" + encodeURIComponent(slug) + "/leer";

  let datos = null;
  let fallo = null;
  try {
    datos = await getText(bookId, pagina, pagina);
  } catch (e) {
    fallo = { status: e.status || 0, message: e.message };
  }

  const pag = datos && Array.isArray(datos.pages) && datos.pages.length ? datos.pages[0] : null;
  const hits = q ? await safe(searchInBook(bookId, q), null) : null;
  const quote = await safe(getQuote(bookId, pagina), null);
  const cita = quote && quote.citation ? quote.citation : null;
  const imagen = pageImage(bookId, pagina, "display");

  return (
    <>
      <p className="meta">
        <a href={"/libro/" + encodeURIComponent(slug)}>{book.display_title || book.title}</a>
        {" "}- {book.author || "autor desconocido"} ({book.published || "s. f."})
      </p>
      <h1>Pagina {pagina}{total ? " de " + total : ""}</h1>

      <div className="nav">
        {pagina > 1 && <a className="btn" href={base + "?p=" + (pagina - 1) + (q ? "&q=" + encodeURIComponent(q) : "")}>Anterior</a>}
        {(!total || pagina < total) && <a className="btn" href={base + "?p=" + (pagina + 1) + (q ? "&q=" + encodeURIComponent(q) : "")}>Siguiente</a>}
        <form action={base} className="row" style={{ gap: 8, alignItems: "center" }}>
          <input name="p" defaultValue={pagina} aria-label="Ir a pagina" style={{ width: 80, padding: 8, borderRadius: 8, background: "#1f1e2a", color: "#ece9f5", border: "1px solid #2e2c3c" }} />
          <button type="submit">Ir</button>
        </form>
        <form action={base} className="row" style={{ gap: 8, alignItems: "center" }}>
          <input name="q" defaultValue={q} placeholder="buscar dentro del libro" aria-label="Buscar en el libro" style={{ width: 220, padding: 8, borderRadius: 8, background: "#1f1e2a", color: "#ece9f5", border: "1px solid #2e2c3c" }} />
          <button type="submit">Buscar</button>
        </form>
        <a className="btn" href={proxyImage(pageImage(bookId, pagina, "full"), 2400)} target="_blank" rel="noreferrer">Imagen grande</a>
      </div>

      {fallo && fallo.status === 429 && (
        <p className="warn">
          Limite de lectura alcanzado: el API permite unas 500 paginas cada 24 h para usuarios anonimos.
          Vuelve a intentarlo en una hora o configura tu propia clave en SL_API_KEY para ampliar la cuota.
          El resto del sitio (catalogo, fichas, galeria, imagenes) sigue funcionando.
        </p>
      )}
      {fallo && fallo.status !== 429 && (
        <p className="error">No se pudo leer el texto de esta pagina ({fallo.status || "error"}).</p>
      )}

      {hits && (
        <div className="panel" style={{ marginBottom: 18 }}>
          <h3>Coincidencias de "{q}" en este libro: {hits.total || 0}</h3>
          <div className="chips">
            {(hits.results || []).slice(0, 40).map((r) => (
              <a className="chip" key={r.pageId || r.pageNumber} href={base + "?p=" + r.pageNumber + "&q=" + encodeURIComponent(q)}>
                pag. {r.pageNumber}
              </a>
            ))}
          </div>
          {!(hits.results || []).length && <p className="meta">Sin coincidencias.</p>}
        </div>
      )}

      <div className="reader">
        <div>
          <h3>Facsimil</h3>
          <img className="pageimg" src={proxyImage(imagen, 1200)} alt={"Pagina " + pagina} />
          <h3 style={{ marginTop: 18 }}>Transcripcion original</h3>
          <div className="textbox">{pag && pag.ocr ? pag.ocr : "(sin transcripcion disponible para esta pagina)"}</div>
        </div>
        <div>
          <h3>Traduccion</h3>
          <div className="textbox">{pag && pag.translation ? pag.translation : "(sin traduccion disponible para esta pagina)"}</div>

          {cita && (
            <>
              <h3 style={{ marginTop: 18 }}>Cita de esta pagina</h3>
              <pre className="cite">{cita.footnote || cita.inline}</pre>
              <pre className="cite">{cita.bibtex}</pre>
              {cita.doi_url && <p className="meta">DOI: <a href={cita.doi_url} target="_blank" rel="noreferrer">{cita.doi_url}</a></p>}
            </>
          )}

          {datos && datos.license && (
            <p className="meta">
              Licencia del texto: {datos.license.spdx || "CC-BY-SA-4.0"} - atribucion:{" "}
              {datos.license.attribution || "Source Library"}
            </p>
          )}
        </div>
      </div>
    </>
  );
}

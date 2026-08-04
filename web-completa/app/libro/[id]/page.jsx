import { getBook, getEditions, getQuote, safe, proxyImage, pick } from "../../../lib/sl";

export const revalidate = 3600;

export default async function Libro({ params }) {
  const p = (await params) || {};
  const id = p.id;
  const book = await safe(getBook(id));

  if (!book) {
    return (
      <>
        <h1>Libro no disponible</h1>
        <p className="error">
          El API no devolvio datos para <b>{id}</b>. Puede ser un identificador invalido, un libro sin
          publicar o una coleccion privada de un tenant.
        </p>
        <p><a className="btn" href="/buscar">Volver a buscar</a></p>
      </>
    );
  }

  const bookId = book.id || book._id || id;
  const slug = book.slug || bookId;
  const editions = await safe(getEditions(bookId), { editions: [] });
  const quote = await safe(getQuote(bookId, 1), null);
  const cover = pick(book.thumbnail, book.thumbnail_page, book.image_display, book.image_thumb);
  const chapters = Array.isArray(book.chapters) ? book.chapters : [];
  const dc = book.dublin_core || {};
  const ai = book.ai_metadata || {};
  const nEd = (editions.editions || []).length;
  const cita = quote && quote.citation ? quote.citation : null;

  return (
    <>
      <h1>{book.display_title || book.title}</h1>
      {book.display_title && book.title !== book.display_title && (
        <p className="lead" style={{ fontStyle: "italic" }}>{book.title}</p>
      )}

      <div className="row" style={{ marginTop: 18 }}>
        <div style={{ flex: "0 0 260px" }}>
          {cover ? (
            <img className="pageimg" src={proxyImage(cover, 800)} alt="Portada" />
          ) : (
            <div className="noimg" style={{ borderRadius: 10 }} />
          )}
        </div>

        <div style={{ flex: "1 1 420px" }}>
          <table className="simple">
            <tbody>
              <tr><th>Autor</th><td>{book.author || dc.creator || "Desconocido"}</td></tr>
              <tr><th>Publicado</th><td>{book.published || dc.date || "s. f."}</td></tr>
              <tr><th>Idioma</th><td>{book.language || dc.language || "?"}</td></tr>
              <tr><th>Paginas</th><td>{book.pages_count || 0} (OCR {book.pages_ocr || 0} / traducidas {book.pages_translated || 0})</td></tr>
              <tr><th>Identificador</th><td>{bookId}</td></tr>
              {book.tenant_slug && <tr><th>Coleccion</th><td>{book.tenant_slug}</td></tr>}
              {dc.publisher && <tr><th>Editor</th><td>{dc.publisher}</td></tr>}
              {dc.identifier && <tr><th>DOI / ID</th><td>{dc.identifier}</td></tr>}
            </tbody>
          </table>

          <div className="nav">
            <a className="btn" href={"/libro/" + encodeURIComponent(slug) + "/leer?p=1"}>Leer</a>
            <a className="btn" href={"/libro/" + encodeURIComponent(slug) + "/versiones"}>
              Versiones {nEd ? "(" + nEd + ")" : ""}
            </a>
            <a className="btn" href={"https://sourcelibrary.org/book/" + encodeURIComponent(bookId)} target="_blank" rel="noreferrer">
              Ver en Source Library
            </a>
          </div>
        </div>
      </div>

      {(ai.summary || ai.description || dc.description) && (
        <>
          <h2>Resumen</h2>
          <p className="lead">{ai.summary || ai.description || dc.description}</p>
          {Array.isArray(ai.topics) && ai.topics.length > 0 && (
            <div className="chips">
              {ai.topics.slice(0, 12).map((t) => (
                <span className="chip" key={String(t)}>{String(t)}</span>
              ))}
            </div>
          )}
        </>
      )}

      {chapters.length > 0 && (
        <>
          <h2>Indice ({chapters.length} secciones)</h2>
          <div className="panel">
            <ol style={{ margin: 0, paddingLeft: 20 }}>
              {chapters.map((c, n) => (
                <li key={c.pageId || n} style={{ marginBottom: 4 }}>
                  <a href={"/libro/" + encodeURIComponent(slug) + "/leer?p=" + (c.pageNumber || 1)}>
                    {c.titleEn || c.title || "Seccion " + (n + 1)}
                  </a>{" "}
                  <span className="meta">pag. {c.pageNumber}</span>
                </li>
              ))}
            </ol>
          </div>
        </>
      )}

      {cita && (
        <>
          <h2>Como citar</h2>
          <pre className="cite">{cita.bibliography || cita.chicago || cita.inline}</pre>
          {cita.doi_url && (
            <p className="meta">DOI: <a href={cita.doi_url} target="_blank" rel="noreferrer">{cita.doi_url}</a></p>
          )}
        </>
      )}
    </>
  );
}

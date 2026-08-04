import { getBook, getEditions, safe } from "../../../../lib/sl";

export const revalidate = 3600;

function nombreContribuidor(c) {
  if (!c) return "";
  if (typeof c === "string") return c;
  const nombre = c.name || c.display_name || c.email || "anonimo";
  return c.role ? nombre + " (" + c.role + ")" : nombre;
}

function textoFrontMatter(fm) {
  if (!fm) return [];
  return Object.keys(fm)
    .filter((k) => typeof fm[k] === "string" && fm[k].trim())
    .map((k) => ({ clave: k, valor: fm[k] }));
}

export default async function Versiones({ params }) {
  const p = (await params) || {};
  const id = p.id;
  const book = await safe(getBook(id));
  const bookId = book ? book.id || book._id || id : id;
  const data = await safe(getEditions(bookId), { editions: [] });
  const ediciones = (data && data.editions ? data.editions : []).slice().sort((a, b) =>
    String(b.created_at || "").localeCompare(String(a.created_at || ""))
  );

  return (
    <>
      <p className="meta">
        <a href={"/libro/" + encodeURIComponent(book ? book.slug || bookId : id)}>
          {book ? book.display_title || book.title : id}
        </a>
      </p>
      <h1>Versiones y ediciones</h1>
      <p className="lead">
        Cada edicion academica congela un conjunto de paginas (hash de contenido), su aparato critico y su
        DOI. Asi una cita hecha hoy sigue apuntando al mismo texto aunque la traduccion se revise despues.
      </p>

      {!ediciones.length && (
        <p className="warn">
          Este libro todavia no tiene ediciones publicadas. Puedes leerlo igualmente en su version viva:{" "}
          <a href={"/libro/" + encodeURIComponent(book ? book.slug || bookId : id) + "/leer?p=1"}>abrir lector</a>.
        </p>
      )}

      {ediciones.map((e) => {
        const doiUrl = e.doi ? "https://doi.org/" + String(e.doi).replace("https://doi.org/", "") : null;
        const cita = e.citation || {};
        const secciones = textoFrontMatter(e.front_matter);
        return (
          <div className="panel" key={e.id} style={{ marginBottom: 18 }}>
            <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
              <h2 style={{ margin: 0, border: 0 }}>
                v{e.version || "?"} {e.version_label ? "- " + e.version_label : ""}
              </h2>
              <div className="chips">
                <span className="chip">{e.status || "sin estado"}</span>
                {e.license && <span className="chip">{e.license}</span>}
                {e.page_count != null && <span className="chip">{e.page_count} paginas</span>}
              </div>
            </div>

            <table className="simple" style={{ marginTop: 12 }}>
              <tbody>
                {cita.title && <tr><th>Titulo de la edicion</th><td>{cita.title}</td></tr>}
                {cita.original_title && <tr><th>Titulo original</th><td>{cita.original_title}</td></tr>}
                {e.published_at && <tr><th>Publicada</th><td>{String(e.published_at).slice(0, 10)}</td></tr>}
                {e.created_at && <tr><th>Creada</th><td>{String(e.created_at).slice(0, 10)}</td></tr>}
                {doiUrl && (
                  <tr>
                    <th>DOI</th>
                    <td><a href={doiUrl} target="_blank" rel="noreferrer">{e.doi}</a></td>
                  </tr>
                )}
                {Array.isArray(e.contributors) && e.contributors.length > 0 && (
                  <tr>
                    <th>Contribuciones</th>
                    <td>{e.contributors.map(nombreContribuidor).filter(Boolean).join(", ")}</td>
                  </tr>
                )}
                {e.content_hash && (
                  <tr><th>Hash de contenido</th><td style={{ fontFamily: "ui-monospace, monospace", fontSize: 12 }}>{String(e.content_hash).slice(0, 24)}...</td></tr>
                )}
                {e.previous_version_doi && (
                  <tr>
                    <th>Version anterior</th>
                    <td><a href={"https://doi.org/" + e.previous_version_doi} target="_blank" rel="noreferrer">{e.previous_version_doi}</a></td>
                  </tr>
                )}
              </tbody>
            </table>

            {e.changelog && (
              <>
                <h3 style={{ marginTop: 16 }}>Cambios</h3>
                <p className="meta" style={{ fontSize: 14 }}>{e.changelog}</p>
              </>
            )}

            {secciones.length > 0 && (
              <details style={{ marginTop: 12 }}>
                <summary style={{ cursor: "pointer", color: "#d8b46a" }}>
                  Aparato critico ({secciones.length} secciones)
                </summary>
                {secciones.map((s) => (
                  <div key={s.clave} style={{ marginTop: 12 }}>
                    <h3>{s.clave.replace(/_/g, " ")}</h3>
                    <div className="textbox" style={{ maxHeight: "40vh" }}>{s.valor}</div>
                  </div>
                ))}
              </details>
            )}

            <div className="nav">
              <a className="btn" href={"/libro/" + encodeURIComponent(book ? book.slug || bookId : id) + "/leer?p=1"}>
                Leer el texto
              </a>
              {doiUrl && <a className="btn" href={doiUrl} target="_blank" rel="noreferrer">Registro en Zenodo</a>}
            </div>
          </div>
        );
      })}
    </>
  );
}

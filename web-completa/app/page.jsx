import { listBooks, safe } from "../lib/sl";
import BookCard from "../lib/BookCard";

export const revalidate = 3600;

export default async function Home() {
  const recientes = await safe(
    listBooks({ limit: 18, sort: "recent-translation", has_translation: true }),
    { books: [], total: 0 }
  );
  const catalogo = await safe(listBooks({ limit: 1 }), { total: 0 });
  const alquimia = await safe(
    listBooks({ limit: 6, search: "alchemy", has_translation: true }),
    { books: [] }
  );

  return (
    <>
      <h1>Mi Biblioteca</h1>
      <p className="lead">
        Catalogo completo, lector bilingue (original + traduccion), versiones academicas con DOI y galeria
        de ilustraciones. Todo se lee en vivo desde el API publico de Source Library: esta app no tiene
        base de datos propia ni copia de los textos.
      </p>

      <div className="chips" style={{ margin: "18px 0" }}>
        <span className="chip">{(catalogo.total || 0).toLocaleString("es")} libros en el catalogo</span>
        <span className="chip">{(recientes.total || 0).toLocaleString("es")} con traduccion</span>
        <span className="chip">cache ISR {revalidate} s</span>
      </div>

      <h2>Traducidos recientemente</h2>
      {recientes.books && recientes.books.length ? (
        <div className="grid">
          {recientes.books.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </div>
      ) : (
        <p className="error">
          No se pudo cargar el catalogo. Comprueba SL_API_BASE o vuelve a intentarlo en unos minutos.
        </p>
      )}

      <h2>Para empezar: alquimia</h2>
      <div className="grid">
        {(alquimia.books || []).map((b) => (
          <BookCard key={b.id} book={b} />
        ))}
      </div>

      <h2>Que puedes hacer aqui</h2>
      <div className="row">
        <div className="panel" style={{ flex: "1 1 260px" }}>
          <h3>Buscar</h3>
          <p className="meta">Por catalogo (titulo, autor) o por texto completo dentro de las traducciones.</p>
          <p><a className="btn" href="/buscar?q=quintessence&modo=texto">Probar busqueda de texto</a></p>
        </div>
        <div className="panel" style={{ flex: "1 1 260px" }}>
          <h3>Leer</h3>
          <p className="meta">Facsimil, transcripcion original y traduccion, con la cita lista para copiar.</p>
        </div>
        <div className="panel" style={{ flex: "1 1 260px" }}>
          <h3>Versiones</h3>
          <p className="meta">Ediciones academicas de cada libro: version, DOI, changelog, contribuciones y licencia.</p>
        </div>
        <div className="panel" style={{ flex: "1 1 260px" }}>
          <h3>Galeria</h3>
          <p className="meta">Ilustraciones extraidas de los libros con su descripcion y procedencia.</p>
          <p><a className="btn" href="/galeria">Ver galeria</a></p>
        </div>
      </div>
    </>
  );
}

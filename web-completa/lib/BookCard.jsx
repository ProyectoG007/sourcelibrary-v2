import { proxyImage, pick } from "./sl";

/* Tarjeta de libro reutilizada en portada, busqueda y colecciones. */
export default function BookCard({ book }) {
  const cover = pick(book.thumbnail, book.image_thumb, book.image_display);
  const href = "/libro/" + encodeURIComponent(book.slug || book.id);
  const pct = book.translation_percent != null ? Math.round(book.translation_percent) : null;
  return (
    <a className="card" href={href}>
      {cover ? <img src={proxyImage(cover, 400)} alt="" loading="lazy" /> : <div className="noimg" />}
      <div className="cardBody">
        <h3>{book.display_title || book.title}</h3>
        <p className="meta">{[book.author, book.published].filter(Boolean).join(" - ")}</p>
        <p className="meta">
          {[book.language, (book.pages_count || 0) + " paginas", pct !== null ? pct + "% traducido" : null]
            .filter(Boolean)
            .join(" - ")}
        </p>
      </div>
    </a>
  );
}

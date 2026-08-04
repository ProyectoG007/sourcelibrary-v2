import "./globals.css";

export const metadata = {
  title: "Mi Biblioteca - lector de Source Library",
  description:
    "Catalogo, lector bilingue, versiones academicas y galeria construidos sobre el API publico de Source Library",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <header className="top">
          <a className="brand" href="/">Mi Biblioteca</a>
          <nav>
            <a href="/">Inicio</a>
            <a href="/buscar">Buscar</a>
            <a href="/galeria">Galeria</a>
          </nav>
          <form className="quick" action="/buscar">
            <input name="q" aria-label="Buscar" placeholder="alquimia, Paracelso, quintaesencia..." />
            <button type="submit">Buscar</button>
          </form>
        </header>

        <main>{children}</main>

        <footer className="bottom">
          <p>
            Datos, transcripciones (OCR) y traducciones:{" "}
            <a href="https://sourcelibrary.org">Source Library</a>. Las traducciones se publican con
            licencia CC BY-SA 4.0 y requieren atribucion; los textos originales estan en dominio publico.
            La fuente reserva el uso de sus datos para entrenamiento de IA (TDM reservation).
          </p>
          <p>
            Este sitio es un cliente de lectura que consulta el API publico en tiempo real: no almacena
            ni redistribuye la coleccion.
          </p>
        </footer>
      </body>
    </html>
  );
}

# web-completa — version completa (Next.js) sobre el API de Source Library

Aplicacion Next.js (App Router) que consulta **en el servidor** el API publico de
Source Library. Es el paso siguiente a `demo-web/` (un solo HTML + proxy): aqui hay
rutas reales, cache ISR, indice por capitulos, pagina de versiones/ediciones con DOI
y galeria.

## Por que es mejor que la version autonoma

| | `demo-web/` (autonoma) | `web-completa/` (esta) |
|---|---|---|
| Ejecucion | HTML + proxy Node | Next.js (React server components) |
| CORS | necesita el proxy | no aplica: el fetch ocurre en el servidor |
| Cache | ninguna | ISR (`revalidate`), 1 llamada por hora y ruta |
| Cuota de lectura | se gasta por visitante | se gasta por cache, no por visitante |
| URLs | una sola pagina | `/libro/[id]`, `/leer`, `/versiones`, `/galeria` |
| SEO / compartir | limitado | HTML renderizado en servidor |

## Puesta en marcha

```bash
cd web-completa
npm install
cp .env.example .env.local   # opcional: solo si quieres cambiar algo
npm run dev                  # http://localhost:3000
```

No hace falta base de datos, ni claves de Gemini, ni MongoDB: **solo lee el API
publico**. `SL_API_KEY` es opcional y sirve para ampliar la cuota de lectura.

## Publicar en internet (Vercel)

1. Importa el repo en Vercel.
2. En *Root Directory* pon `web-completa`.
3. Framework: Next.js (se detecta solo). Build: `npm run build`.
4. Variables de entorno (opcionales): `SL_API_BASE`, `SL_REVALIDATE`, `SL_API_KEY`.
5. Deploy. Cada push a `main` vuelve a desplegar.

La cuenta de Vercel y la clave, si la usas, las creas tu: no se guardan en el repo.

## Rutas

| Ruta | Que muestra | Endpoints que usa |
|---|---|---|
| `/` | portada, estadisticas, ultimos traducidos | `/api/books/library` |
| `/buscar?q=&modo=catalogo|texto&idioma=` | busqueda por catalogo o por texto completo | `/api/books/library`, `/api/search` |
| `/libro/[id]` | ficha: metadatos, resumen, indice de capitulos, cita | `/api/books/[id]`, `/api/books/[id]/editions`, `/api/books/[id]/quote` |
| `/libro/[id]/leer?p=N&q=` | facsimil + transcripcion + traduccion, busqueda interna, cita | `/api/books/[id]/text`, `/api/books/[id]/search`, `/api/books/[id]/quote` |
| `/libro/[id]/versiones` | ediciones academicas: version, DOI, changelog, aparato critico | `/api/books/[id]/editions` |
| `/galeria?q=` | ilustraciones con procedencia | `/api/gallery` |

`[id]` acepta el id de Mongo o el slug del libro.

## A que contenido llegas

- **Catalogo completo publico**: ~19.400 libros listados, ~17.800 con traduccion.
- **Texto de cada pagina**: transcripcion original (OCR) + traduccion al ingles.
- **Busqueda**: por catalogo (rapida) y por texto completo de las traducciones.
- **Ediciones/versiones**: version, etiqueta, estado, DOI de Zenodo, hash de contenido,
  changelog, contribuciones y aparato critico, cuando el libro las tiene publicadas.
- **Imagenes**: miniatura, lectura (1200 px) y detalle (2400 px) via `/api/image`.
- **Citas**: inline, nota, bibliografia, BibTeX, Chicago, MLA y DOI.

## Limites reales (no son bugs)

- **Lectura anonima**: unas **500 paginas cada 24 h**. Al pasarse, el API responde
  `429` con `retry-after: 3600`; el lector muestra un aviso y el resto del sitio sigue.
  Con `SL_API_KEY` (se pide en `https://sourcelibrary.org/developers`) el limite sube.
- **Solo lectura**: crear o editar libros, OCR y traduccion exigen sesion de editor.
- **Colecciones privadas de tenants** (por ejemplo material solo para miembros) no
  aparecen en el API publico.
- **Busqueda semantica y deteccion de duplicados**: disponibles via el servidor MCP del
  repo, no en los endpoints publicos.
- La busqueda de texto completo devuelve **libros**, no pasajes; para localizar la pagina
  exacta se usa la busqueda dentro del libro (`/api/books/[id]/search`).

## Licencia del contenido

Traducciones y transcripciones: **CC BY-SA 4.0**, atribucion a
*Source Library (https://sourcelibrary.org)*. Los textos originales estan en dominio
publico. La fuente **reserva** el uso de sus datos para entrenamiento de IA (TDM
reservation): esta app solo lee y enlaza, no redistribuye ni reentrena.

## Ideas para seguir

- Lector a doble pagina con lupa usando la imagen de 2400 px.
- Favoritos y notas en `localStorage`, exportables a Markdown.
- Paginas de colecciones tematicas con `/api/collections`.
- Vista comparada de dos versiones de la misma edicion.
- Modo tenant: leer solo el catalogo de un socio con `tenant_slug=bph`.

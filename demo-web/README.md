# demo-web — web autonoma sobre Source Library

Una web de una sola pagina, **sin dependencias, sin build y sin claves**, que consume las API
publicas de Source Library. Sirve como plantilla minima para construir tu propio sitio
(catalogo, lector bilingue, galeria) sin montar base de datos ni pipeline de IA.

Archivos:

- `index.html` — la aplicacion completa (HTML + CSS + JS en vanilla).
- `serve.mjs` — servidor local de 80 lineas que sirve el HTML y hace de proxy de la API.

## Como ejecutarla

```bash
node demo-web/serve.mjs
# abre http://localhost:8080
```

Variables opcionales:

```bash
PORT=3001 node demo-web/serve.mjs                          # otro puerto
SL_UPSTREAM=http://localhost:3000 node demo-web/serve.mjs  # contra tu propia instancia
SL_API_KEY=xxxx node demo-web/serve.mjs                    # con clave propia, mas cupo
```

La clave, si la tienes, se lee del entorno y viaja solo del proxy al servidor: nunca
aparece en el HTML ni en el navegador.

### Por que no basta abrir el archivo con doble clic

El navegador bloquea por CORS cualquier llamada a `sourcelibrary.org/api/...` hecha desde
otro origen (o desde `file://`). Hay dos formas validas de servir esta pagina:

1. **Con el proxy incluido** (`serve.mjs`): el HTML y `/api/*` salen del mismo origen.
2. **Desde el mismo dominio de la API**: copiala en `public/` de este proyecto y abre
   `http://localhost:3000/demo-web/index.html` con `npm run dev`.

Si la publicas en Vercel/Netlify/GitHub Pages necesitaras un proxy equivalente (una
funcion serverless que reenvie `/api/*`), o llamar a la API desde el servidor.

## Que hace la demo

- **Catalogo**: rejilla de libros con filtros por idioma, orden y solo-traducidos, mas
  paginacion incremental. Segundo modo de busqueda por relevancia.
- **Lector**: original (OCR) y traduccion en columnas paralelas, imagen de la pagina,
  navegacion por pagina y salto por capitulos detectados por IA.
- **Busqueda dentro del libro**: fragmentos con numero de pagina, clic para saltar.
- **Cita**: copia al portapapeles el texto traducido, la cita formateada y el enlace estable.
- **Galeria**: ilustraciones y obras, clic para abrir el libro en la pagina de origen.

## Que contenido es accesible (y con que limites)

Abierto sin autenticacion:

| Endpoint | Para que |
|---|---|
| `/api/books/library` | catalogo con filtros, orden y colecciones |
| `/api/books` | listado simple |
| `/api/books/[id]` | metadatos, capitulos, fuente de las imagenes |
| `/api/books/[id]/text` | OCR + traduccion pagina a pagina |
| `/api/books/[id]/search` | busqueda dentro del libro con fragmentos |
| `/api/books/[id]/quote` | cita verbatim + inline, footnote, BibTeX, Chicago, MLA, DOI |
| `/api/search` | busqueda global (a nivel de libro) |
| `/api/gallery` | ilustraciones y obras |
| `/api/image` | redimensionado y recorte al vuelo |
| `/api/embed/bph/...` | catalogo del tenant BPH |

Limites reales que vas a encontrar:

- **Cupo de lectura**: 500 paginas de texto cada 24 h de forma anonima. Al pasarte, la API
  responde `HTTP 429` con cabecera `retry-after`. Identificarse (gratis) o usar una clave
  propia sube el limite. La demo ya muestra ese mensaje en pantalla.
- **Latencia**: la busqueda global puede tardar varios segundos; el catalogo es rapido.
- **Solo lectura**: crear libros, editar metadatos o lanzar OCR y traduccion en lote exige
  sesion con rol de editor. Desde esta demo no se puede escribir nada.
- **Solo por MCP**: la busqueda semantica de pasajes y la deteccion de duplicados no tienen
  endpoint REST publico; se usan a traves del servidor MCP (`mcp-server/`).
- **Contenido restringido**: las colecciones privadas o de solo miembros de un tenant no
  aparecen en las rutas publicas.

## Licencia del contenido

Las respuestas de la API incluyen un bloque `license`. En la practica: las traducciones son
**CC BY-SA 4.0** y exigen atribuir a Source Library; los textos originales son de dominio
publico; y el uso del corpus para **entrenar modelos esta reservado** (hay politica de TDM y
licencia aparte). Si publicas tu web, deja la atribucion visible, como hace el pie de esta demo.

## Ideas para seguir

- Guardar favoritos y notas en `localStorage`.
- Vista de dos paginas enfrentadas y lupa usando el tier de 2400px de `/api/image`.
- Exportar una seleccion de citas a Markdown o BibTeX.
- Portarla a Next.js con `fetch` en el servidor y `revalidate`: desaparece el problema de
  CORS y el cupo se consume una vez por cache, no por visitante.

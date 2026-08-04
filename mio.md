# mio.md — Guía personal del proyecto

Notas propias para entender **sourcelibrary-v2**: para qué sirve, cómo trabajarlo en local y cómo montar una web encima usando **MCP**.

---

## 1. ¿Para qué sirve este proyecto?

Source Library es una biblioteca digital abierta de fuentes primarias impresas (siglos XV–XVIII) centrada en alquimia, Hermetica, Cábala, rosicrucianismo y ciencia temprana.

El proyecto resuelve tres problemas:

1. **Leer** libros antiguos escaneados: detecta páginas dobles, recorta y hace OCR con IA (Gemini Vision) en latín, alemán, griego, árabe, etc.
2. **Entender** esos textos: los traduce al inglés manteniendo continuidad entre páginas.
3. **Citar** con rigor: cada libro tiene metadatos académicos, DOI (vía Zenodo) y enlaces de cita estables por página.

Además ofrece galería de ilustraciones extraídas de las páginas, colecciones temáticas, búsqueda semántica, exportación a EPUB/PDF y subdominios para instituciones asociadas (por ejemplo la Bibliotheca Philosophica Hermetica).

En resumen: **es una plataforma de digitalización + traducción con IA + publicación académica**, construida sobre Next.js.

---

## 2. Cómo está construido (mapa rápido)

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TailwindCSS |
| Backend | API routes de Next.js + workers en AWS Lambda |
| Base de datos | MongoDB Atlas (principal), Supabase (embeddings) |
| IA | Google Gemini (OCR, traducción, resúmenes, split) |
| Almacenamiento | Vercel Blob (imágenes), S3 / R2 (archivo) |
| Auth | NextAuth v5 con adaptador de MongoDB |
| Hosting | Vercel |
| Tests | Vitest (unit/integración), Playwright (E2E) |
| Agentes | @modelcontextprotocol/sdk (servidor MCP propio) |

Carpetas que conviene mirar primero:

```text
src/app/            rutas, páginas y endpoints (api/)
src/lib/            lógica de negocio (mongodb.ts, extracción de imágenes, auth)
src/components/     componentes reutilizables
scripts/workers/    pipeline de procesamiento (orquestador, extracción)
prompts/            prompts de IA (ocr, translation, split-detection)
mcp-server/         servidor MCP + CLI
.claude/docs/       documentación de arquitectura para agentes
tests/              unit e integración
```

Documentos de referencia del repo: ARCHITECTURE.md, CLAUDE.md, AGENTS.md, el system map y la carpeta docs/.

---

## 3. Cómo trabajar el proyecto

### 3.1 Arranque en local

```bash
git clone https://github.com/ProyectoG007/sourcelibrary-v2.git
cd sourcelibrary-v2
npm install
cp .env.example .env.local   # y rellenar credenciales
npm run dev                  # http://localhost:3000
```

Variables mínimas en .env.local: MONGODB_URI, NEXTAUTH_SECRET, GOOGLE_API_KEY, VERCEL_BLOB_TOKEN y las de AWS. Opcionales: STRIPE_SECRET_KEY, ZENODO_TOKEN, SUPABASE_URL.

> Sin base de datos propia no verás contenido: para prototipar es más rápido consumir la API pública de producción (ver sección 5).

### 3.2 Ciclo de trabajo

```bash
git switch -c feat/mi-cambio     # una rama por tema
npm run lint
npm run test:unit
npx tsc --noEmit                 # obligatorio antes del PR
npm run test:e2e                 # si toca UI o pipeline
git push origin feat/mi-cambio
gh pr create --base main
```

Reglas del repo que importan:

- Un solo asunto por PR; no mezclar refactor con feature.
- Verificar con grep -rn antes de borrar código.
- Nunca hardcodear secretos: todo por variables de entorno.
- Aislamiento de tenants: pasar la auditoría (node scripts/audit-bph-leaks.mjs) antes de desplegar.
- Ningún borrado de libros o páginas sin confirmación explícita.
- Licencia AGPL-3.0-or-later: cualquier aportación la hereda.

Cada rama empujada genera un preview automático en Vercel; el merge a main despliega a producción.

### 3.3 Flujo del pipeline (para entender los datos)

```text
Import → Detección de split → OCR → Traducción → Enriquecimiento → Publicación
```

Modelo de datos: **Books** (metadatos bibliográficos, estado de proceso, curación) → **Pages** (imagen original, coordenadas de recorte 0–1000, OCR, traducción) → **Gallery images** (ilustraciones con metadatos y puntuación de calidad).

---

## 4. ¿Qué es MCP aquí?

MCP (Model Context Protocol) es el protocolo que permite que un modelo (Claude Code, Claude Desktop u otros clientes) use herramientas externas. Este repo incluye mcp-server/, que expone la biblioteca como **12 herramientas** sin necesidad de API key:

- Búsqueda: search_library, search_translations, search_concept (semántica), search_within_book, list_books
- Lectura y cita: get_book, get_book_text, get_quote
- Imágenes: search_images
- Curación: check_duplicate
- Feedback: submit_feedback, share_findings

Instalación en Claude Code:

```bash
claude mcp add source-library -- npx -y @source-library/mcp-server
```

En Claude Desktop, añadir al fichero de configuración:

```json
{
  "mcpServers": {
    "source-library": {
      "command": "npx",
      "args": ["-y", "@source-library/mcp-server"]
    }
  }
}
```

También funciona como CLI:

```bash
npx @source-library/mcp-server search "philosopher's stone"
source-library translations "harmony of the spheres" --json | jq .
```

Nota práctica: para citar, usar siempre get_quote (devuelve el texto verbatim y el shortlink de cita) en lugar de parafrasear de memoria.

---

## 5. Cómo crear una web usando MCP

Idea clave: **MCP es el copiloto de desarrollo y la fuente de datos durante el diseño; la web en producción consume las API REST públicas.**

### Paso 1 — Conectar el servidor MCP a tu agente

Instalarlo como en la sección 4 y comprobar que las herramientas responden (por ejemplo pidiendo list_books con limit=5).

### Paso 2 — Explorar el corpus con MCP antes de programar

Preguntas útiles al agente ya conectado:

- "Lista 20 libros en alemán traducidos y dime qué colecciones cubren."
- "Busca pasajes sobre prima materia y devuélveme las citas con enlace."
- "Busca emblemas con el ouroboros y de qué libros salen."

Así decides qué secciones tendrá la web (portada, buscador, ficha de libro, lector, galería) con datos reales, no inventados.

### Paso 3 — Que el agente genere el proyecto

```bash
npx create-next-app@latest mi-web-fuentes --ts --tailwind --app
cd mi-web-fuentes
claude mcp add source-library -- npx -y @source-library/mcp-server
claude
```

Prompt de arranque que funciona bien:

> Usa las herramientas de source-library MCP para explorar el catálogo. Después crea en este proyecto Next.js: (1) portada con 12 libros destacados, (2) buscador que consulte /api/search, (3) ficha de libro en /libro/[slug], (4) lector paginado con original y traducción en dos columnas, (5) galería de ilustraciones. Usa las rutas públicas de sourcelibrary.org, cachea con revalidate y muestra siempre el enlace de cita en cada pasaje.

### Paso 4 — Endpoints públicos que usará la web

| Endpoint | Uso |
|---|---|
| /api/search?q=… | búsqueda a texto completo |
| /api/books?limit=&offset= | listado simple del catálogo |
| /api/books/library?limit=&skip= | navegación rica: filtros, orden, colecciones |
| /api/books/[id] | metadatos por id o slug |
| /api/books/[id]/quote?page=N | cita formateada + DOI |
| /api/gallery?limit=24 | ilustraciones y obras |
| /api/image?url=…&w=400 | redimensionado/recorte al vuelo (400 / 1200 / 2400) |
| /api/embed/bph/books | catálogo del tenant BPH |

Ejemplo de consumo en un Server Component:

```tsx
// app/page.tsx
async function getBooks() {
  const res = await fetch(
    "https://sourcelibrary.org/api/books/library?limit=12&has_translation=true",
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) throw new Error("Fallo al cargar el catálogo");
  return res.json();
}

export default async function Home() {
  const data = await getBooks();
  return (
    <ul>
      {data.books?.map((b: any) => (
        <li key={b._id}>
          <a href={"/libro/" + b.slug}>{b.title}</a> — {b.author}
        </li>
      ))}
    </ul>
  );
}
```

### Paso 5 — Errores comunes a evitar

- /api/bph/books **no existe**: el catálogo del tenant vive en /api/embed/bph/... o con ?tenant_slug=bph sobre /api/books/library.
- No hay ruta pública /api/[tenant]/books; esas rutas son de edición y procesado.
- Las rutas de escritura (POST/PATCH, OCR y traducción en lote) exigen sesión con rol de editor.
- Servir siempre imágenes a través de /api/image con el tier adecuado; no enlazar el original completo en cuadrículas.

### Paso 6 — Publicar

```bash
git init && git add . && git commit -m "feat: web sobre Source Library"
# push al repo y conectar el proyecto en Vercel
```

Si en vez de una web propia quieres un **reading room dentro de la plataforma**, la vía correcta es el sistema de tenants: subdominio propio, branding, colecciones filtradas y control de acceso público o solo para miembros.

---

## 6. Checklist antes de cada entrega

- [ ] npm run lint sin errores
- [ ] npm run test:unit y test:integration en verde
- [ ] npx tsc --noEmit limpio
- [ ] E2E si toca UI o pipeline
- [ ] Sin secretos en el código
- [ ] Auditoría de fuga entre tenants pasada
- [ ] PR con alcance descrito (qué entra y qué no)

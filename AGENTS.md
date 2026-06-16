# AGENTS.md

PDF Tool — clon de ilovepdf con Docker, FastAPI, React + Vite, PyMuPDF.

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | Python 3.12 + FastAPI + Uvicorn |
| PDF engine | PyMuPDF (`fitz`) — merge, split, rotate, reorder, render previews, compress |
| Imágenes | Pillow — images-to-PDF conversion |
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS v4 |
| Linter | Ruff (Python), ESLint (JS/TS) |
| Proxy/Serve | Nginx reverse proxy `/api/` → backend |
| Orquestación | Docker Compose (2 servicios: `frontend`, `backend`) |

## Estructura

```
/
├── docker-compose.yml          # + healthchecks en ambos servicios
├── Makefile                    # up, down, test, lint, logs, restart
├── pyproject.toml              # Ruff config
├── backend/
│   ├── .dockerignore
│   ├── Dockerfile              # Python 3.12-slim, sin mupdf-tools
│   ├── requirements.txt
│   └── app/
│       ├── main.py             # FastAPI, CORS, lifespan + cleanup task (session + previews), /api/health
│       ├── config.py           # MAX_UPLOAD_MB, SESSION_TTL_MINUTES, MAX_FILES_PER_UPLOAD
│       ├── schemas.py          # Pydantic models
│       ├── routers/            # 13 endpoints (upload, preview, merge, merge-pages, split, compress, rotate, rotate-page, reorder, download, to-pdf, to-docx, to-xlsx)
│       └── services/           # pdf_service.py, image_service.py, file_service.py
└── frontend/
    ├── .dockerignore
    ├── Dockerfile              # multi-stage: Node 22 build → Nginx 1.27-alpine
    ├── nginx.conf              # proxy /api/ → backend:8000, 100M upload limit
    ├── eslint.config.js
    ├── package.json
    └── src/
        ├── types.ts, api/client.ts   # parseError() para mensajes de error JSON
        ├── components/               # Layout (sin props split/compress), NavTabs, FileDropzone, FileCard, PreviewImage
        └── components/views/         # MergeView, SplitView (ranges local), CompressView (level local), RotateView, ReorderView, ImageToPdfView
```

## Comandos

```bash
# Development (requiere Docker Desktop)
make build          # Construye ambas imágenes
make up             # En http://localhost:80
make up --build     # Reconstruye y levanta
make test           # Ejecuta tests del backend
make lint           # Ruff + ESLint
make logs           # Sigue logs en vivo
make restart        # Reinicia servicios
make down           # Detiene servicios

# Dev local sin Docker
cd backend  && pip install -r requirements.txt && uvicorn app.main:app --reload
cd frontend && npm install && npm run dev      # Vite dev server en :5173 (proxy /api → :8000)

# Frontend build verification
cd frontend && npm run build  # tsc -b && vite build (verifica tipos + bundle)

# Backend tests
cd backend && python -m pytest tests/ -v
```

## API endpoints

| Método | Ruta | Propósito |
|--------|------|-----------|
| GET | `/api/health` | Healthcheck (retorna status + max_upload_mb) |
| POST | `/api/upload` | Subir PDF(s) (máx 50 archivos), devuelve `id`, `page_count`, `size_bytes` |
| GET | `/api/preview/{id}/{page}` | PNG de página (lazy load) |
| POST | `/api/merge` | Fusiona PDFs enteros en orden |
| POST | `/api/merge-pages` | Fusiona páginas específicas `[{"file_id","page"}]` en orden |
| POST | `/api/split` | Divide por rangos `[[1,3],[4,5]]`, acepta `filename` opcional |
| POST | `/api/compress` | Nivel 0-3 (garbage + deflate + clean) |
| POST | `/api/rotate` | Ángulo 90/180/270 en páginas específicas |
| POST | `/api/rotate-page` | Rota una página 90° in-place (acumulativo) |
| POST | `/api/reorder` | Reordena páginas `[2,1,3]` |
| POST | `/api/to-pdf` | Convierte imágenes (PNG, JPEG, etc.) a PDF |
| POST | `/api/to-docx` | Convierte PDF a Word (.docx) |
| POST | `/api/to-xlsx` | Convierte PDF a Excel (.xlsx) |
| GET | `/api/download/{id}` | Descarga resultado (acepta `?filename=` query param opcional) |

## Reglas del proyecto

- **PyMuPDF se importa como `fitz`**, no como `PyMuPDF`.
- **Tailwind v4**: usa `@import "tailwindcss"` en CSS (no `@tailwind` directives). Dark mode con `@custom-variant dark` y clase `.dark` en `<html>`. Config en `vite.config.ts` con plugin `@tailwindcss/vite`, no archivo `tailwind.config.js` separado.
- **Nginx** limita subida a 100 MB (`client_max_body_size`), debe coincidir con `MAX_UPLOAD_MB` del backend.
- **HashRouter** (no BrowserRouter) porque se sirve estático detrás de Nginx.
- **Previsualizaciones**: lazy-load con `IntersectionObserver` en `PreviewImage.tsx`. El backend genera PNG bajo demanda sin caché. Cleanup de previews cada 60s (mismo TTL que sesiones).
- **Archivos temporales**: se guardan en `/tmp/sessions/`. Backend expone `SESSION_TTL_MINUTES` (default 30). Cleanup periódico implementado en `main.py` (tarea asyncio cada 60s, limpia sessions + previews).
- **Upload**: el frontend envía `FormData` con campo `files` (lista). El backend recibe `list[UploadFile] = File(...)`. Valida extensión `.pdf`, tamaño máximo (`MAX_UPLOAD_MB`), y cantidad máxima de archivos (`MAX_FILES_PER_UPLOAD`).
- **Download**: el frontend usa `<a href={downloadUrl(id, filename)} download>`. Si el usuario escribe `test` (sin `.pdf`), el backend añade `.pdf` automáticamente. Si no se envía `filename`, usa `result.pdf`.
- **Error handling**: todos los routers envuelven operaciones PDF en try/except con mensajes claros. `client.ts` usa `parseError()` que intenta parsear JSON (campo `detail`) antes de caer a texto plano.
- **Healthchecks**: backend tiene `GET /api/health`, verificado cada 15s por Docker. frontend usa `nginx -t` cada 30s.

## Convenciones de código

- Backend: routers delgados → lógica en `services/pdf_service.py`. Cada operación PDF envuelta en try/except.
- Frontend: estado de archivos subidos en `App.tsx`, se pasa por props. Cada vista es autónoma (maneja su propio loading/download, y su estado específico como `rangesText` o `level`).
- Sin autenticación (proyecto local).
- Toolbar de Layout acepta props genéricas (filename, action, download). Controles específicos (ranges, compress level) se renderizan dentro de cada vista.

## Gotchas

- `merge.py` y `reorder.py` abren dos `fitz.open()` simultáneamente — no hay riesgo de deadlock porque PyMuPDF es single-threaded para operaciones de lectura.
- `insert_pdf(src, from_page=..., to_page=...)` usa índices 0-based. El frontend envía páginas 1-based, el backend resta 1.
- ReorderView y MergeView usan HTML5 Drag & Drop nativo (no librería externa).
- Tanto ReorderView como MergeView permiten seleccionar páginas (click en miniatura) y eliminarlas con botón "Delete selected (N)".
- MergeView muestra todas las páginas de todos los archivos en una grilla plana, permitiendo reordenar y eliminar páginas individuales antes de fusionar.
- El endpoint `/api/merge-pages` acepta `file_pages: [{file_id, page}]` y genera el PDF con esas páginas exactas en ese orden.
- SplitView maneja `rangesText` como estado local (no en App.tsx). El input de rangos está dentro del propio componente.
- CompressView maneja `level` como estado local. Los botones de nivel se renderizan dentro del componente.
- RotateView: miniaturas con botón circular ↻ que rota 90° in-place cada clic (acumulativo: 90→180→270→0). Usa `POST /api/rotate-page`.
- `rotate_page_inplace` usa temp file + `os.replace` porque PyMuPDF no permite guardar directamente sobre el original.
- `download.py` usa `os.path.splitext(path)` para obtener la extensión real del archivo. Si el query param `filename` no tiene extensión, la añade automáticamente. Si no se envía `filename`, usa `"result.pdf"` por defecto.
- Los archivos de resultado siempre se guardan con extensión `.pdf` en disco (por `file_service.py`).
- Cleanup task limpia tanto `SESSIONS_DIR` como `PREVIEWS_DIR` cada 60s.

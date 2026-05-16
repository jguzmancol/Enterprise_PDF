# AGENTS.md

PDF Tool — clon de ilovepdf con Docker, FastAPI, React + Vite, PyMuPDF.

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | Python 3.12 + FastAPI + Uvicorn |
| PDF engine | PyMuPDF (`fitz`) — merge, split, rotate, reorder, render previews, compress |
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS v4 |
| Proxy/Serve | Nginx reverse proxy `/api/` → backend |
| Orquestación | Docker Compose (2 servicios: `frontend`, `backend`) |

## Estructura

```
/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py              # FastAPI app, CORS, lifespan
│       ├── config.py            # MAX_UPLOAD_MB, SESSION_TTL_MINUTES
│       ├── schemas.py           # Pydantic models
│       ├── routers/             # 12 endpoints (upload, preview, merge, merge-pages, split, compress, rotate, rotate-page, reorder, download, to-pdf, pdf-to-images)
│       └── services/            # pdf_service.py (PyMuPDF ops), image_service.py (Pillow), file_service.py (temp storage)
└── frontend/
    ├── Dockerfile               # multi-stage: build → nginx
    ├── nginx.conf               # proxy /api/ → backend:8000, 100M upload limit
    ├── vite.config.ts           # proxy /api → localhost:8000 for dev
    └── src/
        ├── types.ts, api/client.ts
        ├── components/           # Layout, NavTabs, FileDropzone, FileCard, PreviewImage (lazy load via IntersectionObserver)
        └── components/views/     # MergeView, SplitView, CompressView, RotateView, ReorderView, ImageToPdfView, PdfToImageView
```

## Comandos

```bash
# Development (requiere Docker Desktop)
docker compose build        # Construye ambas imágenes
docker compose up          # En http://localhost:80
docker compose up --build  # Reconstruye y levanta

# Dev local sin Docker
cd backend  && pip install -r requirements.txt && uvicorn app.main:app --reload
cd frontend && npm install && npm run dev      # Vite dev server en :5173 (proxy /api → :8000)

# Frontend build verification
cd frontend && npm run build  # tsc -b && vite build (verifica tipos + bundle)

# Backend verification
python -c "import sys; sys.path.insert(0, 'backend'); from app.main import app; print(len(app.routes))"
```

## API endpoints

| Método | Ruta | Propósito |
|--------|------|-----------|
| POST | `/api/upload` | Subir PDF(s), devuelve `id`, `page_count`, `size_bytes` |
| GET | `/api/preview/{id}/{page}` | PNG de página (lazy load) |
| POST | `/api/merge` | Fusiona PDFs enteros en orden |
| POST | `/api/merge-pages` | Fusiona páginas específicas `[{"file_id","page"}]` en orden |
| POST | `/api/split` | Divide por rangos `[[1,3],[4,5]]`, acepta `filename` opcional |
| POST | `/api/compress` | Nivel 0-3 (garbage + deflate + clean) |
| POST | `/api/rotate` | Ángulo 90/180/270 en páginas específicas |
| POST | `/api/rotate-page` | Rota una página 90° in-place (acumulativo) |
| POST | `/api/reorder` | Reordena páginas `[2,1,3]` |
| POST | `/api/to-pdf` | Convierte imágenes (PNG, JPEG, etc.) a PDF |
| GET | `/api/download/{id}` | Descarga resultado (acepta `?filename=` query param opcional) |

## Reglas del proyecto

- **PyMuPDF se importa como `fitz`**, no como `PyMuPDF`.
- **Tailwind v4**: usa `@import "tailwindcss"` en CSS (no `@tailwind` directives). Dark mode con `@custom-variant dark (&:where(.dark, .dark *))` en CSS y clase `.dark` en `<html>`. Config en `vite.config.ts` con plugin `@tailwindcss/vite`, no archivo `tailwind.config.js` separado.
- **Nginx** limita subida a 100 MB (`client_max_body_size`), debe coincidir con `MAX_UPLOAD_MB` del backend.
- **HashRouter** (no BrowserRouter) porque se sirve estático detrás de Nginx.
- **Previsualizaciones**: lazy-load con `IntersectionObserver` en `PreviewImage.tsx`. El backend genera PNG bajo demanda sin caché (se puede agregar después).
- **Archivos temporales**: se guardan en `/tmp/sessions/`. Backend expone `SESSION_TTL_MINUTES` (default 30), pero el cleanup no está implementado — los archivos se acumulan hasta reinicio del contenedor.
- **Upload**: el frontend envía `FormData` con campo `files` (lista). El backend recibe `list[UploadFile] = File(...)`.
- **Download**: el frontend usa `<a href={downloadUrl(id, filename)} download>` con el atributo `download` sin valor. Si el usuario escribe `test` (sin `.pdf`), el frontend envía `?filename=test`. El backend `download.py` detecta la extensión real del archivo en disco y la añade automáticamente si el filename del query param no tiene extensión.

## Convenciones de código

- Backend: routers delgados → lógica en `services/pdf_service.py`.
- Frontend: estado de archivos subidos en `App.tsx`, se pasa por props. Cada vista es autónoma (maneja su propio loading/download).
- Sin autenticación (proyecto local).

## Gotchas

- `merge.py` y `reorder.py` abren dos `fitz.open()` simultáneamente — no hay riesgo de deadlock porque PyMuPDF es single-threaded para operaciones de lectura.
- `insert_pdf(src, from_page=..., to_page=...)` usa índices 0-based. El frontend envía páginas 1-based, el backend resta 1.
- ReorderView y MergeView usan HTML5 Drag & Drop nativo (no librería externa).
- Tanto ReorderView como MergeView permiten seleccionar páginas (click en miniatura) y eliminarlas con botón "Delete selected (N)".
- MergeView muestra todas las páginas de todos los archivos en una grilla plana, permitiendo reordenar y eliminar páginas individuales antes de fusionar.
- El endpoint `/api/merge-pages` acepta `file_pages: [{file_id, page}]` y genera el PDF con esas páginas exactas en ese orden.
- SplitView acepta formato `"1-3, 5, 7-9"` en un `<input>` de texto y campo opcional para nombre del archivo de salida. También muestra miniaturas de páginas clickeables para agregar rangos.
- RotateView: miniaturas con botón circular ↻ que rota 90° in-place cada clic (acumulativo: 90→180→270→0). Usa `POST /api/rotate-page`.
- `rotate_page_inplace` usa temp file + `os.replace` porque PyMuPDF no permite guardar directamente sobre el original.
- `download.py` usa `os.path.splitext(path)` para obtener la extensión real del archivo (`".pdf"` o `".zip"`). Si el query param `filename` no tiene extensión, la añade automáticamente. Si no se envía `filename`, usa `"result.pdf"` por defecto.
- `image_service.py` solo tiene `images_to_pdf` (Pillow). El endpoint `pdf-to-images` se eliminó.
- Los archivos de resultado siempre se guardan con extensión `.pdf` en disco (por `file_service.py`).

# SalesIA Enterprise — versión PostgreSQL para despliegue

Sistema académico de gestión de ventas y análisis estadístico. Incluye React + TypeScript + Vite, FastAPI, SQLAlchemy y PostgreSQL.

## Cambios de esta versión
- Se retiraron los formularios y botones **Agregar** de las pantallas Clientes y Productos. Estas pantallas solo muestran los registros.
- Se eliminó el fallback silencioso a SQLite: el backend necesita una URL de PostgreSQL en `DATABASE_URL`.
- La URL del backend en React se configura con `VITE_API_URL`, necesaria para Vercel.
- FastAPI crea las tablas al iniciar y luego carga los datos de demostración si la base está vacía.
- Se añadió `render.yaml` como guía de despliegue en Render.

## Requisitos para trabajar localmente
Necesitas Python 3.11 o 3.12 y Node.js 20 o posterior. No hace falta Docker. En una computadora administrada, las políticas pueden impedir instalar programas; si ya están instalados, normalmente puedes usarlos sin permisos de administrador.

### 1. PostgreSQL
Para local, instala/usa un servidor PostgreSQL y crea una base de datos. En `backend`, crea un archivo `.env` a partir de `.env.example` y define `DATABASE_URL` con tus datos reales.
Ejemplo de formato:
`DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/salesia`

No subas `.env` a GitHub: contiene secretos.

### 2. Backend
En una terminal dentro de `backend`:
```bash
python -m venv .venv
```
Windows:
```powershell
.venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
La API local se abre en `http://localhost:8000/docs`.

### 3. Frontend
En otra terminal dentro de `frontend`:
```bash
npm install
```
Crea `frontend/.env`:
```env
VITE_API_URL=http://localhost:8000
```
Luego ejecuta:
```bash
npm run dev
```
Abre `http://localhost:5173`.

## Credenciales de demostración
- Correo: `admin@salesia.com`
- Contraseña: `admin123`

Cámbialas antes de cualquier uso real. Son solo para una demostración académica.

## Despliegue: GitHub → Render → Vercel

### A. GitHub
1. Descomprime el ZIP.
2. En GitHub crea un repositorio nuevo, por ejemplo `salesia-enterprise`.
3. Sube el **contenido de la carpeta `salesia-enterprise`**, no el ZIP. Debes ver `backend`, `frontend`, `database`, `docs`, `render.yaml` y `README.md` en la raíz.
4. No subas archivos `.env`, `.venv`, `node_modules` ni contraseñas reales.

### B. Render (base de datos y backend)
1. En Render crea una base de datos PostgreSQL. Copia su **Internal Database URL** para usarla en un servicio alojado en Render.
2. Crea un **New → Web Service** y conecta el repositorio GitHub.
3. Root Directory: `backend`.
4. Build Command: `pip install -r requirements.txt`.
5. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
6. En Environment agrega:
   - `DATABASE_URL`: la URL interna de PostgreSQL de Render.
   - `SECRET_KEY`: una clave larga y aleatoria.
   - `CORS_ORIGINS`: la URL final de Vercel, por ejemplo `https://tu-app.vercel.app`.
   - `ENVIRONMENT`: `production`.
7. Despliega y abre `https://TU-API.onrender.com/docs`. Si la documentación carga, la API está respondiendo.

Nota: Render puede cobrar por algunos servicios o tener límites/condiciones que cambian. Revisa el precio y las condiciones actuales antes de crear la base de datos. No necesitas Docker ni permisos de administrador en la PC para hacer el despliegue desde la web.

### C. Vercel (frontend)
1. En Vercel elige **Add New → Project** e importa el mismo repositorio de GitHub.
2. Configura **Root Directory** como `frontend`.
3. Framework preset: Vite.
4. Build Command: `npm run build`.
5. Output Directory: `dist`.
6. En Environment Variables agrega:
   - Name: `VITE_API_URL`
   - Value: la URL de Render sin `/docs`, por ejemplo `https://TU-API.onrender.com`.
7. Presiona Deploy.
8. Copia el dominio `https://tu-app.vercel.app`.
9. Regresa a Render y actualiza `CORS_ORIGINS` con ese dominio exacto; guarda y vuelve a desplegar el backend.

## Importante sobre GitHub
No es simplemente subir “lo descomprimido” desde cualquier nivel: sube los archivos que están dentro de la carpeta raíz `salesia-enterprise`, de modo que `backend/`, `frontend/` y `render.yaml` queden directamente en la raíz del repositorio.

## Alcance académico
El proyecto incluye los módulos base de autenticación, clientes, productos, ventas, inventario, estadísticas (media/mediana), Bayes, Analytics, insights, reportes y auditoría básica. Es una base académica/MVP; antes de producción real se requiere reforzar permisos por rol, secretos, migraciones, validaciones y pruebas completas.

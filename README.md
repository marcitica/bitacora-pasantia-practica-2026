# Sistema de Bitácoras de Pasantía 2026 — CTP Cañas

Aplicación web para el registro y seguimiento de las bitácoras de pasantía de
los estudiantes. Incluye inicio de sesión con roles (estudiante /
administrador), registro diario de horas y tareas, revisión por parte del
docente, y administración de estudiantes, empresas, supervisores y
especialidades.

**Stack:** Node.js + Express + MongoDB (Mongoose) en el backend, HTML/CSS/JS
puro en el frontend.

---

## 1. Requisitos previos

- [Node.js](https://nodejs.org/) 18 o superior (incluye `npm`)
- Una base de datos MongoDB. La forma más sencilla es un clúster gratuito en
  [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
- Git

## 2. Instalación local

```bash
# 1. Clonar el repositorio
git clone https://github.com/<su-usuario>/<su-repositorio>.git
cd <su-repositorio>

# 2. Instalar dependencias
npm install

# 3. Crear el archivo de variables de entorno
cp .env.example .env
```

Abra el archivo `.env` recién creado y complete sus propios valores (vea la
sección de variables de entorno más abajo).

```bash
# 4. Crear el usuario administrador inicial (usa los datos ADMIN_* del .env)
npm run seed

# (Opcional) Cargar el grupo de estudiantes de Desarrollo Web
npm run seed:desarrollo-web

# 5. Iniciar el servidor
npm run dev     # con recarga automática (nodemon), recomendado en desarrollo
# o bien
npm start       # modo normal
```

El servidor queda disponible en `http://localhost:3000`. Esa misma URL sirve
tanto la API (`/api/...`) como el frontend (`login.html`, `estudiante.html`,
`administrador.html`).

## 3. Variables de entorno

| Variable         | Descripción                                                         |
|-------------------|----------------------------------------------------------------------|
| `PORT`            | Puerto donde corre el servidor (por defecto `3000`)                  |
| `MONGODB_URI`      | Cadena de conexión a MongoDB (Atlas o local)                        |
| `JWT_SECRET`       | Clave secreta para firmar los tokens de sesión (JWT)                 |
| `ADMIN_NOMBRE`     | Nombre del administrador que crea el script `npm run seed`           |
| `ADMIN_CORREO`     | Correo de acceso del administrador                                   |
| `ADMIN_PASSWORD`   | Contraseña inicial del administrador (cámbiela después del primer login) |

El archivo `.env` **nunca debe subirse a GitHub** — ya está excluido en
`.gitignore`. Use `.env.example` como plantilla.

> ⚠️ **Importante — credenciales de este proyecto:** el archivo `.env` que
> tenían hasta ahora contenía una cadena de conexión real de MongoDB Atlas,
> un `JWT_SECRET` y una contraseña de administrador en texto plano. Como esos
> valores se compartieron fuera de un `.env` protegido, **se recomienda
> rotarlos cuanto antes**: cambie la contraseña del usuario de MongoDB Atlas
> desde el panel de Atlas (Database Access), genere un `JWT_SECRET` nuevo y
> cambie `ADMIN_PASSWORD` antes de desplegar en producción.

## 4. Estructura del proyecto

```
Bitacora2026/
├── backend/
│   ├── config/          # Conexión a MongoDB
│   ├── controllers/      # Lógica de cada recurso (auth, estudiantes, bitácoras, etc.)
│   ├── middleware/        # Verificación de token y de roles
│   ├── models/            # Esquemas de Mongoose
│   ├── routes/             # Definición de endpoints de la API
│   ├── seed/                # Scripts para poblar datos iniciales
│   └── server.js             # Punto de entrada del servidor Express
├── frontend/
│   ├── login.html, estudiante.html, administrador.html, bitacora.html
│   ├── css/estilos.css
│   └── js/ (api.js, login.js, estudiante.js, administrador.js, bitacora.js)
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## 5. Subir el proyecto a GitHub

```bash
git init
git add .
git commit -m "Primer commit: sistema de bitácoras de pasantía"
git branch -M main
git remote add origin https://github.com/<su-usuario>/<su-repositorio>.git
git push -u origin main
```

Antes de hacer el primer commit, confirme que `.env` **no** aparece en
`git status` (debe estar ignorado). Si por error ya lo había subido antes en
otro repositorio, considere ese repositorio comprometido y rote todas las
credenciales igualmente.

## 6. Desplegar en producción

GitHub solo aloja el código fuente — **no ejecuta el servidor Node.js**. Para
que la aplicación funcione en línea necesita un servicio que sí ejecute
Node.js. Algunas opciones gratuitas o económicas:

- **[Render](https://render.com/)** — "New Web Service", conecte su
  repositorio de GitHub, use `npm install` como build command y `npm start`
  como start command. Agregue las variables de entorno (`MONGODB_URI`,
  `JWT_SECRET`, etc.) en la sección "Environment".
- **[Railway](https://railway.app/)** — proceso similar: conecta el repo,
  define las variables de entorno y despliega automáticamente.
- **[Fly.io](https://fly.io/)** — requiere un poco más de configuración
  (Dockerfile o `fly.toml`) pero también funciona bien para Node + MongoDB
  Atlas.

En cualquiera de estos servicios, recuerde:

1. Configurar las mismas variables que tiene en su `.env` local.
2. En MongoDB Atlas, en "Network Access", permitir la IP del servicio elegido
   (o `0.0.0.0/0` si el servicio usa IPs dinámicas, aceptando el riesgo que
   eso implica).
3. Ejecutar `npm run seed` una sola vez (puede hacerlo localmente apuntando
   al `MONGODB_URI` de producción) para crear el administrador inicial.

## 7. Scripts disponibles

| Comando                        | Qué hace                                                   |
|----------------------------------|--------------------------------------------------------------|
| `npm start`                      | Inicia el servidor en modo normal                            |
| `npm run dev`                    | Inicia el servidor con recarga automática (nodemon)           |
| `npm run seed`                   | Crea/actualiza el usuario administrador a partir del `.env`   |
| `npm run seed:desarrollo-web`    | Carga el grupo de estudiantes de la especialidad Desarrollo Web |

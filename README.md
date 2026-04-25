# Aurx AI

Plataforma web de chat con inteligencia artificial multi-modelo. Los usuarios se registran, inician sesión y pueden conversar con modelos de OpenAI, Anthropic (Claude), Google (Gemini) y xAI (Grok) usando un sistema de tokens propio respaldado por Firebase.

---

## Índice

1. [Características](#características)
2. [Estructura del proyecto](#estructura-del-proyecto)
3. [Requisitos](#requisitos)
4. [Instalación local](#instalación-local)
5. [Configurar Firebase](#configurar-firebase)
6. [Variables de entorno](#variables-de-entorno)
7. [Claves de los proveedores de IA](#claves-de-los-proveedores-de-ia)
8. [Ejecutar el servidor](#ejecutar-el-servidor)
9. [Rutas disponibles](#rutas-disponibles)
10. [Despliegue en Render](#despliegue-en-render)
11. [Preguntas frecuentes](#preguntas-frecuentes)

---

## Características

- **Multi-modelo** — Cambia entre más de 20 modelos de IA en tiempo real desde el selector de la interfaz.
- **Autenticación segura** — Registro e inicio de sesión con Firebase Authentication. Los tokens se verifican en cada petición al servidor.
- **Sistema de tokens** — Cada cuenta tiene un saldo de tokens. Se descuentan por uso y se reinician cada 24 horas automáticamente.
- **Historial de uso** — Cada conversación queda registrada en Firebase Realtime Database.
- **Protección de rutas** — Si el usuario no tiene sesión activa, es redirigido al formulario de registro. Si el token expira, es redirigido al inicio de sesión.
- **Archivos adjuntos** — El usuario puede adjuntar documentos, imágenes o tomar fotos desde la cámara dentro del chat.
- **Pantalla completa de secciones** — Comunidad, Notificaciones, Ayuda y Configuración accesibles desde el menú lateral.
- **URLs limpias** — `/`, `/login`, `/chat-ai` sin extensiones `.html`.

---

## Estructura del proyecto

```
Aurx-ai/
├── src/                        ← Código del servidor (Node.js)
│   ├── config/
│   │   ├── firebase.js         ← Inicialización de Firebase Admin SDK
│   │   └── models.js           ← Registro de todos los modelos de IA disponibles
│   ├── controllers/
│   │   ├── ai.controller.js    ← Lógica del chat y listado de modelos
│   │   ├── auth.controller.js  ← Registro y login de usuarios
│   │   └── user.controller.js  ← Perfil y datos de control del usuario
│   ├── middlewares/
│   │   ├── auth.middleware.js  ← Verifica el token Bearer en cada petición protegida
│   │   └── error.middleware.js ← Manejador global de errores
│   ├── providers/
│   │   ├── openai.js           ← Llama a la API de OpenAI
│   │   ├── claude.js           ← Llama a la API de Anthropic
│   │   ├── gemini.js           ← Llama a la API de Google Gemini
│   │   └── grok.js             ← Llama a la API de xAI Grok
│   ├── routes/
│   │   ├── index.js            ← Router principal (/api/auth, /api/ai, /api/users)
│   │   ├── ai.routes.js        ← POST /api/ai/chat · GET /api/ai/models
│   │   ├── auth.routes.js      ← POST /api/auth/register · POST /api/auth/login
│   │   └── user.routes.js      ← GET /api/users/profile · GET /api/users/control
│   ├── services/
│   │   ├── ai.service.js       ← Enruta la petición al proveedor correcto
│   │   └── token.service.js    ← Descuenta tokens y gestiona el reset diario
│   ├── app.js                  ← Configuración de Express (sin listen)
│   └── server.js               ← Punto de entrada, inicia el servidor
├── public/                     ← Archivos estáticos (frontend)
│   ├── assets/
│   │   └── icons/              ← Íconos PNG de cada proveedor de IA
│   ├── css/
│   │   ├── chat-ai.css
│   │   ├── fullscreen-nav.css
│   │   ├── login.css
│   │   ├── main.css
│   │   └── menu.css
│   ├── js/
│   │   ├── chat-ai.js          ← Lógica completa del chat (selector de modelo, archivos, cámara)
│   │   ├── fullscreen-nav.js   ← Navegación de pantalla completa (Comunidad, Ayuda, etc.)
│   │   ├── login.js            ← Formulario de login/registro/recuperación
│   │   ├── main.js             ← Página de inicio
│   │   └── menu.js             ← Menú lateral
│   ├── chat-ai.html
│   ├── index.html
│   └── login.html
├── .env.example                ← Plantilla de variables de entorno
├── .gitignore
├── package.json
└── package-lock.json
```

---

## Requisitos

| Herramienta | Versión mínima | Descarga |
|---|---|---|
| Node.js | 18.0.0 | https://nodejs.org |
| npm | incluido con Node.js | — |
| Cuenta Firebase | gratuita (Spark) | https://firebase.google.com |
| Al menos una clave de IA | OpenAI / Anthropic / Google / xAI | ver sección siguiente |

---

## Instalación local

### 1. Clonar el repositorio

```bash
git clone https://github.com/devcashflow42-sys/Aurx-ai.git
cd Aurx-ai
```

### 2. Instalar dependencias

```bash
npm install
```

Esto instala: `express`, `cors`, `dotenv` y `firebase-admin`.

### 3. Crear el archivo de variables de entorno

```bash
cp .env.example .env
```

Abre el archivo `.env` con cualquier editor de texto y rellena tus valores (ver secciones siguientes).

---

## Configurar Firebase

Aurx AI usa **Firebase Authentication** y **Firebase Realtime Database**. Sigue estos pasos:

### Paso 1 — Crear un proyecto Firebase

1. Ve a [https://console.firebase.google.com](https://console.firebase.google.com)
2. Haz clic en **Agregar proyecto**
3. Escribe el nombre del proyecto (p. ej. `aurx-ai`) y sigue el asistente

### Paso 2 — Activar Authentication

1. En el menú lateral selecciona **Authentication** → **Comenzar**
2. En la pestaña **Sign-in method** activa **Correo electrónico/Contraseña**
3. Guarda los cambios

### Paso 3 — Activar Realtime Database

1. En el menú lateral selecciona **Realtime Database** → **Crear base de datos**
2. Elige la región más cercana a tus usuarios
3. Inicia en **modo de prueba** (puedes ajustar las reglas después)
4. Copia la URL que aparece, tiene este formato:
   ```
   https://tu-proyecto-default-rtdb.firebaseio.com
   ```
   → Esa es tu `FIREBASE_DB_URL`

### Paso 4 — Obtener la Service Account (clave del servidor)

1. Ve a **Configuración del proyecto** (ícono de engranaje) → **Cuentas de servicio**
2. Haz clic en **Generar nueva clave privada**
3. Se descargará un archivo `.json` — ábrelo con un editor de texto
4. Copia **todo el contenido** del JSON
5. Pégalo en tu `.env` en la variable `FIREBASE_SERVICE_ACCOUNT` como una sola línea:

```env
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"tu-proyecto","private_key_id":"abc123","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxx@tu-proyecto.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}
```

> **Importante:** Todo el JSON debe ir en una sola línea, sin saltos de línea entre las llaves.

### Paso 5 — Obtener la Web API Key

1. Ve a **Configuración del proyecto** → **General**
2. En la sección **Tus apps** busca el campo **Clave de API web**
3. Esa es tu `FIREBASE_API_KEY` (empieza con `AIza...`)

---

## Variables de entorno

Abre `.env` y completa cada campo:

```env
# ── Servidor ──────────────────────────────────────────
PORT=3000

# ── Firebase ──────────────────────────────────────────
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
FIREBASE_DB_URL=https://tu-proyecto-default-rtdb.firebaseio.com
FIREBASE_API_KEY=AIzaSy...

# ── Proveedores de IA ─────────────────────────────────
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=AIzaSy...
GROK_API_KEY=xai-...
```

> Puedes dejar vacías las claves de los proveedores que no uses. Si un usuario selecciona un modelo cuyo proveedor no tiene clave configurada, recibirá un mensaje de error en el chat.

---

## Claves de los proveedores de IA

| Proveedor | Modelos incluidos | Dónde obtener la clave |
|---|---|---|
| **OpenAI** | GPT-4o, GPT-5 Mini, GPT-5.4, GPT-5.4 Pro… | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| **Anthropic** | Claude 4.5 Haiku, Claude 4.6 Sonnet, Claude 4.7 Opus… | [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys) |
| **Google** | Gemini 1.5 Pro, Gemini 2.0 Flash, Gemini 3.1 Pro… | [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) |
| **xAI** | Grok 2, Grok 4, Grok 4.1 Fast… | [console.x.ai](https://console.x.ai/) |

---

## Ejecutar el servidor

### Modo desarrollo (con auto-recarga)

```bash
npm run dev
```

El servidor se reinicia automáticamente cada vez que guardas un archivo.

### Modo producción

```bash
npm start
```

Abre tu navegador en:

```
http://localhost:3000
```

### Verificar que funciona

```bash
curl http://localhost:3000/health
# Respuesta esperada: {"status":"ok"}
```

---

## Rutas disponibles

### Páginas web

| URL | Descripción |
|---|---|
| `GET /` | Página de inicio (index.html) |
| `GET /login` | Formulario de login y registro |
| `GET /chat-ai` | Interfaz del chat (requiere sesión) |
| `GET /health` | Health-check del servidor |

### API REST

Todas las rutas de API empiezan con `/api`.

#### Autenticación (sin token)

| Método | Ruta | Body | Descripción |
|---|---|---|---|
| `POST` | `/api/auth/register` | `{ name, email, password, verifyPassword }` | Crea una cuenta nueva |
| `POST` | `/api/auth/login` | `{ email, password }` | Inicia sesión y devuelve el token |

#### Chat (requiere `Authorization: Bearer <token>`)

| Método | Ruta | Body | Descripción |
|---|---|---|---|
| `POST` | `/api/ai/chat` | `{ prompt, model? }` | Envía un mensaje a la IA seleccionada |
| `GET` | `/api/ai/models` | — | Lista todos los modelos disponibles |

#### Usuario (requiere `Authorization: Bearer <token>`)

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/users/profile` | Datos del perfil del usuario |
| `GET` | `/api/users/control` | Rol, estado y plan del usuario |

---

## Despliegue en Render

Render es la plataforma recomendada para alojar este proyecto de forma gratuita.

### Paso 1 — Conectar el repositorio

1. Ve a [https://render.com](https://render.com) y crea una cuenta
2. Haz clic en **New → Web Service**
3. Conecta tu cuenta de GitHub y selecciona el repositorio `Aurx-ai`

### Paso 2 — Configurar el servicio

| Campo | Valor |
|---|---|
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Branch** | `main` |

### Paso 3 — Agregar las variables de entorno

En la sección **Environment** de tu servicio en Render, agrega cada variable:

1. Haz clic en **Add Environment Variable**
2. Agrega las siguientes una por una:

```
FIREBASE_SERVICE_ACCOUNT   →  pega el JSON completo en una sola línea
FIREBASE_DB_URL            →  https://tu-proyecto-default-rtdb.firebaseio.com
FIREBASE_API_KEY           →  AIzaSy...
OPENAI_API_KEY             →  sk-...
ANTHROPIC_API_KEY          →  sk-ant-...
GOOGLE_AI_API_KEY          →  AIzaSy...
GROK_API_KEY               →  xai-...
```

> No necesitas agregar `PORT` — Render lo asigna automáticamente.

### Paso 4 — Desplegar

Haz clic en **Create Web Service**. Render ejecutará `npm install` y luego `npm start`. Cuando el despliegue termine verás la URL pública de tu aplicación.

---

## Preguntas frecuentes

**¿Por qué el chat redirige al registro si no inicio sesión?**
Por diseño. Si accedes a `/chat-ai` sin tener una sesión activa, el sistema te lleva directamente al formulario de crear cuenta. Si ya tienes cuenta, inicia sesión desde el enlace en esa misma página.

**¿Qué pasa si el token de sesión expira?**
Firebase Authentication emite tokens con duración de 1 hora. Si expira mientras usas el chat, al enviar el siguiente mensaje el servidor responderá con un error de autenticación y serás redirigido al formulario de inicio de sesión automáticamente.

**¿Se puede usar solo con OpenAI y dejar las demás claves vacías?**
Sí. Las claves vacías no causan errores en el arranque del servidor. Solo verás un error en el chat si seleccionas un modelo cuyo proveedor no tiene clave configurada.

**¿Dónde se almacenan los datos de los usuarios?**
Todo se guarda en Firebase Realtime Database bajo las siguientes rutas:
- `usersFirebase/{uid}` — nombre, email, fecha de registro
- `controlUsers/{uid}` — rol, estado y plan
- `tokenUsers/{uid}` — saldo de tokens, consumo y fecha del último reset
- `usageLogs/{uid}/{logId}` — historial detallado de cada conversación

**¿Cómo cambio el límite de tokens por usuario?**
En `src/services/token.service.js` ajusta la constante `DAILY_TOKEN_ALLOWANCE`. En `src/controllers/auth.controller.js` ajusta `FREE_TOKENS` para el saldo inicial al registrarse.

**El servidor arranca pero da error de Firebase.**
Verifica que `FIREBASE_SERVICE_ACCOUNT` sea un JSON válido en una sola línea y que `FIREBASE_DB_URL` incluya el protocolo `https://`. Puedes validar el JSON en [jsonlint.com](https://jsonlint.com) antes de pegarlo.

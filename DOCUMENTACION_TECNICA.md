# Documentación Técnica - Sistema de Diplomas 2.0

## 📋 Información General

**Nombre del Proyecto:** Sistema de Diplomas Dinámico
**Versión:** 2.0
**Fecha:** Noviembre 2025
**Autor:** Desarrollador Kilo Code
**Tecnologías:** Next.js 16, Node.js, Firebase, Vercel

## 🏗️ Arquitectura del Sistema

### Arquitectura General

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Base de       │
│   (Next.js)     │◄──►│   (Node.js)     │◄──►│   Datos         │
│                 │    │                 │    │   (Firebase)    │
│ - Páginas       │    │ - API Routes    │    │                 │
│ - Componentes   │    │ - Controladores │    │ - Firestore     │
│ - Lógica cliente│    │ - Servicios     │    │ - Storage       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
       │                       │                       │
       └───────────────────────┼───────────────────────┘
                               │
                    ┌─────────────────┐
                    │   Despliegue    │
                    │   (Vercel)      │
                    └─────────────────┘
```

### Arquitectura Frontend

```
diplomas-frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Layout principal
│   ├── page.tsx          # Página de inicio
│   ├── editor/           # Página del editor
│   ├── lotes/            # Página de lotes
│   └── globals.css       # Estilos globales
├── components/           # Componentes React
│   ├── editor/          # Componentes del editor
│   ├── home/            # Componentes de inicio
│   └── layout/          # Componentes de layout
├── lib/                 # Utilidades y configuración
│   ├── api.ts           # Cliente API
│   └── firebaseClient.ts # Configuración Firebase
└── public/              # Archivos estáticos
```

### Arquitectura Backend

```
backend/
├── src/
│   ├── server.js         # Servidor principal (Express)
│   ├── db.js            # Configuración base de datos
│   ├── routes/          # Rutas API
│   │   ├── designs.js   # CRUD diseños
│   │   ├── elements.js  # CRUD elementos
│   │   ├── fonts.js     # CRUD fuentes
│   │   └── images.js    # CRUD imágenes
│   └── models/          # Modelos de datos
│       ├── Design.js    # Modelo Diseño
│       ├── Element.js   # Modelo Elemento
│       ├── Font.js      # Modelo Fuente
│       └── Image.js     # Modelo Imagen
└── package.json         # Dependencias
```

## 🛠️ Tecnologías Utilizadas

### Frontend
- **Next.js 16** - Framework React con App Router
- **React 18** - Biblioteca de componentes
- **TypeScript** - Tipado estático
- **Bootstrap 5** - Framework CSS
- **html-to-image** - Conversión HTML a imagen
- **xlsx** - Procesamiento de archivos Excel
- **jspdf** - Generación de PDFs

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **Sequelize** - ORM para bases de datos
- **MySQL** - Base de datos relacional
- **CORS** - Manejo de cross-origin requests

### Base de Datos y Servicios
- **Firebase Firestore** - Base de datos NoSQL
- **Firebase Storage** - Almacenamiento de archivos
- **Firebase Auth** - Autenticación (configurado pero no usado)

### Despliegue y DevOps
- **Vercel** - Plataforma de despliegue
- **Vercel Analytics** - Análisis de uso
- **GitHub** - Control de versiones
- **npm** - Gestión de dependencias

## 📁 Estructura de Archivos Detallada

### Frontend (`diplomas-frontend/`)

#### Páginas (`app/`)
- `layout.tsx` - Layout raíz con navegación y analytics
- `page.tsx` - Página de inicio (redirecciona a /home)
- `home/page.tsx` - Página principal con descarga de plantillas
- `editor/page.tsx` - Editor visual de diplomas
- `lotes/page.tsx` - Procesamiento masivo de diplomas

#### Componentes (`components/`)
- `editor/CanvasEditor.tsx` - Editor principal de diplomas
- `editor/types.ts` - Tipos TypeScript para el editor
- `home/DownloadTemplateButtons.tsx` - Botones de descarga de plantillas
- `layout/AppNavbar.tsx` - Barra de navegación

#### Utilidades (`lib/`)
- `api.ts` - Cliente para llamadas a la API
- `firebaseClient.ts` - Configuración lazy de Firebase

### Backend (`backend/`)

#### Servidor (`src/`)
- `server.js` - Configuración de Express con rutas y middleware
- `db.js` - Configuración de conexión a base de datos

#### Rutas API (`src/routes/`)
- `designs.js` - CRUD para diseños de diplomas
- `elements.js` - CRUD para elementos de diseño
- `fonts.js` - CRUD para fuentes
- `images.js` - CRUD para imágenes

#### Modelos (`src/models/`)
- `Design.js` - Modelo para diseños guardados
- `Element.js` - Modelo para elementos de diseño
- `Font.js` - Modelo para fuentes disponibles
- `Image.js` - Modelo para imágenes almacenadas

## 🔌 APIs y Endpoints

### Base URL
- **Desarrollo:** `http://localhost:3001`
- **Producción:** Configurado en Vercel

### Endpoints Disponibles

#### Diseños (`/api/designs`)
```
GET    /api/designs     # Listar todos los diseños
GET    /api/designs/:id # Obtener diseño por ID
POST   /api/designs     # Crear nuevo diseño
PUT    /api/designs/:id # Actualizar diseño
DELETE /api/designs/:id # Eliminar diseño
```

#### Elementos (`/api/elements`)
```
GET    /api/elements     # Listar elementos
POST   /api/elements     # Crear elemento
PUT    /api/elements/:id # Actualizar elemento
DELETE /api/elements/:id # Eliminar elemento
```

#### Fuentes (`/api/fonts`)
```
GET    /api/fonts     # Listar fuentes
POST   /api/fonts     # Crear fuente
PUT    /api/fonts/:id # Actualizar fuente
DELETE /api/fonts/:id # Eliminar fuente
```

#### Imágenes (`/api/images`)
```
GET    /api/images     # Listar imágenes
POST   /api/images     # Subir imagen
DELETE /api/images/:id # Eliminar imagen
```

## ⚙️ Configuración

### Variables de Entorno

#### Frontend (`.env.local`)
```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
```

#### Backend (`.env.local`)
```bash
# Database Configuration
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=diplomas_db

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

### Configuración de Firebase

1. **Crear proyecto en Firebase Console**
2. **Habilitar Firestore Database**
3. **Configurar Storage**
4. **Obtener credenciales de configuración**
5. **Configurar reglas de seguridad**

### Configuración de Vercel

1. **Conectar repositorio GitHub**
2. **Configurar variables de entorno**
3. **Configurar build settings**
4. **Configurar domains personalizados**

## 🚀 Instalación y Desarrollo

### Prerrequisitos

- Node.js 18+
- npm o yarn
- MySQL (para desarrollo local)
- Cuenta de Firebase
- Cuenta de Vercel

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/dinamicoPD/Diploma_web.git
cd Diploma_web

# Instalar dependencias del frontend
cd diplomas-frontend
npm install

# Instalar dependencias del backend
cd ../backend
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales
```

### Desarrollo Local

```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend
cd diplomas-frontend
npm run dev
```

### Build de Producción

```bash
# Frontend
cd diplomas-frontend
npm run build

# Backend (si es necesario)
cd backend
npm run build
```

## 📊 Base de Datos

### Esquema de Firestore

#### Colección `designs`
```javascript
{
  id: string,
  name: string,
  data: {
    format: 'letter' | 'legal',
    orientation: 'portrait' | 'landscape',
    dpi: 150 | 200 | 300,
    backgroundUrl?: string,
    elements: CanvasElement[],
    medalImages?: Record<1|2|3, string>
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### Colección `fonts`
```javascript
{
  id: string,
  family: string,
  format: 'woff2' | 'woff' | 'truetype' | 'opentype',
  dataUrl: string,
  createdAt: Timestamp
}
```

#### Colección `images`
```javascript
{
  id: string,
  name: string,
  url: string,
  size: number,
  createdAt: Timestamp
}
```

## 🔧 Solución de Problemas

### Problemas Comunes

#### 1. Error de Firebase API Key
```
Error: Firebase: Error (auth/invalid-api-key)
```
**Solución:** Verificar variables de entorno de Firebase

#### 2. Error de prerendering
```
Error occurred prerendering page "/editor"
```
**Solución:** Verificar configuración `dynamic = 'force-dynamic'`

#### 3. Error de dependencias SWC
```
Found lockfile missing swc dependencies
```
**Solución:** Ejecutar `npm install` en el directorio correcto

#### 4. Error de CORS
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solución:** Verificar configuración CORS en backend

#### 5. Error de build en Vercel
```
Command "npm run build" exited with 1
```
**Solución:** Verificar logs de build y corregir errores de TypeScript

### Comandos Útiles

```bash
# Limpiar cache de Next.js
cd diplomas-frontend
rm -rf .next

# Reinstalar dependencias
npm ci

# Verificar TypeScript
npx tsc --noEmit

# Verificar ESLint
npx eslint .

# Verificar build
npm run build
```

## 🔄 Despliegue

### Despliegue Automático (Vercel)

1. **Push a rama main**
2. **Vercel detecta cambios automáticamente**
3. **Build y deploy automático**
4. **URL de producción actualizada**

### Despliegue Manual

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Configuración de Vercel

#### `vercel.json`
```json
{
  "builds": [
    {
      "src": "diplomas-frontend/package.json",
      "use": "@vercel/next"
    },
    {
      "src": "backend/src/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "backend/src/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "diplomas-frontend/$1"
    }
  ]
}
```

## 📈 Monitoreo y Analytics

### Vercel Analytics

- **Páginas vistas**
- **Sesiones de usuario**
- **Rendimiento de la aplicación**
- **Errores en producción**

### Logs de Vercel

```bash
# Ver logs de producción
vercel logs

# Ver logs de un deployment específico
vercel logs <deployment-url>
```

## 🔒 Seguridad

### Configuración de Firebase Security Rules

#### Firestore Rules
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Solo usuarios autenticados pueden leer/escribir
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

#### Storage Rules
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Variables de Entorno Sensibles

- Nunca commitear `.env` files
- Usar variables de entorno de Vercel para producción
- Rotar API keys periódicamente

## 🚀 Optimizaciones y Mejoras Futuras

### Rendimiento
- [ ] Implementar caching de diseños
- [ ] Optimizar carga de imágenes
- [ ] Lazy loading de componentes
- [ ] Code splitting

### Funcionalidades
- [ ] Autenticación de usuarios
- [ ] Plantillas predefinidas
- [ ] Exportación a múltiples formatos
- [ ] Colaboración en tiempo real

### DevOps
- [ ] CI/CD pipeline completo
- [ ] Tests automatizados
- [ ] Monitoring avanzado
- [ ] Backup automático

## 📞 Soporte y Contacto

**Desarrollador:**DinamicoPD

**Email:** soporte@diplomas.com

**Repositorio:** https://github.com/dinamicoPD/Diploma_web

**Documentación:** https://diplomas.com/docs

---

**Última actualización:** Noviembre 2025
**Versión:** 2.0

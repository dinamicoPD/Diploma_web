# Documentación Técnica - Sistema de Diplomas 2.0

## 📋 Información General

**Nombre del Proyecto:** Sistema de Diplomas Dinámico
**Versión:** 2.0
**Fecha:** Mayo 2026
**Tecnologías:** Next.js 16, Node.js, Supabase, Vercel

## 🏗️ Arquitectura del Sistema

### Arquitectura General

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Base de       │
│   (Next.js)     │◄──►│   (Node.js)     │◄──►│   Datos         │
│                 │    │                 │    │   (Supabase)    │
│ - Páginas       │    │ - API Routes    │    │                 │
│ - Componentes   │    │ - Controladores │    │ - PostgreSQL    │
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
│   └── supabaseClient.ts # Configuración Supabase
└── public/              # Archivos estáticos
```

### Arquitectura Backend

```
backend/
├── src/
│   ├── server.js         # Servidor principal (Express)
│   ├── db.js            # Configuración Supabase
│   ├── routes/          # Rutas API
│   │   ├── designs.js   # CRUD diseños
│   │   ├── elements.js  # CRUD elementos
│   │   ├── fonts.js     # CRUD fuentes
│   │   ├── images.js    # CRUD imágenes
│   │   └── upload.js    # Subida de archivos
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
- **React 19** - Biblioteca de componentes
- **TypeScript** - Tipado estático
- **Bootstrap 5** - Framework CSS
- **Supabase Client** - Cliente para Supabase
- **html-to-image** - Conversión HTML a imagen
- **xlsx** - Procesamiento de archivos Excel
- **jspdf** - Generación de PDFs

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **@supabase/supabase-js** - Cliente Supabase
- **Cloudinary** - Almacenamiento de archivos
- **CORS** - Manejo de cross-origin requests

### Base de Datos y Servicios
- **Supabase PostgreSQL** - Base de datos relacional
- **Supabase Storage** - Almacenamiento de archivos
- **Supabase Auth** - Autenticación

### Despliegue y DevOps
- **Vercel** - Plataforma de despliegue
- **GitHub** - Control de versiones
- **npm** - Gestión de dependencias

## 📁 Estructura de Archivos Detallada

### Frontend (`diplomas-frontend/`)

#### Páginas (`app/`)
- `layout.tsx` - Layout raíz con navegación
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
- `supabaseClient.ts` - Configuración de Supabase

### Backend (`backend/`)

#### Servidor (`src/`)
- `server.js` - Configuración de Express con rutas y middleware
- `db.js` - Configuración de conexión a Supabase

#### Rutas API (`src/routes/`)
- `designs.js` - CRUD para diseños de diplomas
- `elements.js` - CRUD para elementos de diseño
- `fonts.js` - CRUD para fuentes
- `images.js` - CRUD para imágenes
- `upload.js` - Subida de archivos a Cloudinary

#### Modelos (`src/models/`)
- `Design.js` - Operaciones en tabla designs
- `Element.js` - Operaciones en tabla elements
- `Font.js` - Operaciones en tabla fonts
- `Image.js` - Operaciones en tabla images

## 🔌 APIs y Endpoints

### Base URL
- **Desarrollo:** `http://localhost:4000`
- **Producción:** `https://[tu-dominio].vercel.app`

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
GET    /api/elements/:id # Obtener elemento
POST   /api/elements     # Crear elemento
PUT    /api/elements/:id # Actualizar elemento
DELETE /api/elements/:id # Eliminar elemento
```

#### Fuentes (`/api/fonts`)
```
GET    /api/fonts     # Listar fuentes
GET    /api/fonts/:id # Obtener fuente
POST   /api/fonts     # Crear fuente
PUT    /api/fonts/:id # Actualizar fuente
DELETE /api/fonts/:id # Eliminar fuente
```

#### Imágenes (`/api/images`)
```
GET    /api/images     # Listar imágenes
GET    /api/images/:id # Obtener imagen
POST   /api/images     # Subir imagen
DELETE /api/images/:id # Eliminar imagen
```

#### Subida de archivos (`/api/upload`)
```
POST   /api/upload/image # Subir imagen a Cloudinary
POST   /api/upload/font  # Subir fuente a Cloudinary
```

## ⚙️ Configuración

### Variables de Entorno

#### Frontend (`.env.local`)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_URL=/
```

#### Backend (`.env`)
```bash
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
PORT=4000
CORS_ORIGIN=https://[tu-dominio].vercel.app
```

### Configuración de Supabase

1. **Crear proyecto en Supabase Console**
2. **Habilitar PostgreSQL Database**
3. **Crear tablas:**

```sql
create table designs (
  id uuid default uuid_generate_v4() primary key,
  name text,
  data jsonb,
  medal_images jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

create table fonts (
  id uuid default uuid_generate_v4() primary key,
  family text,
  format text,
  dataUrl text,
  fileName text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

create table elements (
  id uuid default uuid_generate_v4() primary key,
  design_id uuid references designs(id),
  type text,
  x numeric, y numeric, w numeric, h numeric, z numeric,
  properties jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

create table images (
  id uuid default uuid_generate_v4() primary key,
  name text, url text, format text,
  width numeric, height numeric, size numeric,
  user_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);
```

## 🚀 Instalación y Desarrollo

### Prerrequisitos
- Node.js 18+
- npm o yarn
- Cuenta de Supabase
- Cuenta de Cloudinary
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
# Ver archivos .env.example
```

### Desarrollo Local

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd diplomas-frontend
npm run dev
```

## 🔄 Despliegue

### Despliegue Automático (Vercel)

El proyecto está configurado para auto-deploy desde la rama `main`. Cada push a GitHub desencadena un nuevo deploy.

### Configuración de Vercel

Las variables de entorno deben configurarse en el dashboard de Vercel bajo Settings > Environment Variables.

## 📞 Soporte

**Repositorio:** https://github.com/dinamicoPD/Diploma_web
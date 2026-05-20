# Diplomas Web

Sistema de creación y gestión de diplomas digitales con editor visual y almacenamiento en la nube.

## 🚀 Características

- **Editor Visual**: Interfaz intuitiva para diseñar diplomas con elementos arrastrables
- **Gestión de Fuentes**: Soporte para fuentes personalizadas (WOFF, WOFF2, TTF, OTF)
- **Almacenamiento en Supabase**: Base de datos PostgreSQL y storage para archivos
- **API REST**: Backend con Express.js para operaciones CRUD
- **Responsive**: Diseño adaptativo para diferentes dispositivos

## 🛠️ Tecnologías

### Frontend
- **Next.js 16** - Framework React con App Router
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Framework CSS utilitario
- **React DnD** - Arrastrar y soltar elementos
- **Supabase Client SDK** - Conexión con servicios de Supabase

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **Supabase** - Base de datos PostgreSQL
- **CORS** - Manejo de solicitudes cross-origin

### Base de Datos
- **Supabase** - Base de datos PostgreSQL
- **Cloudinary** - Almacenamiento de archivos (imágenes y fuentes)

## 📁 Estructura del Proyecto

```
diplomas-web/
├── backend/                    # API REST
│   ├── src/
│   │   ├── routes/            # Rutas de la API
│   │   │   ├── designs.js     # CRUD diseños
│   │   │   ├── elements.js    # CRUD elementos
│   │   │   ├── fonts.js       # CRUD fuentes
│   │   │   ├── images.js      # CRUD imágenes
│   │   │   └── upload.js      # Subida de archivos
│   │   ├── models/            # Modelos de datos (Supabase)
│   │   ├── db.js              # Configuración Supabase
│   │   └── server.js          # Servidor Express
│   ├── .env                   # Variables de entorno
│   └── package.json
├── diplomas-frontend/          # Aplicación Next.js
│   ├── src/
│   │   ├── app/               # App Router
│   │   ├── components/        # Componentes React
│   │   ├── lib/               # Utilidades y configuración
│   │   │   ├── supabaseClient.ts  # Cliente Supabase
│   │   │   └── api.ts             # API helper functions
│   └── package.json
├── .gitignore
└── README.md
```

## 🔧 Instalación y Configuración

### Prerrequisitos
- Node.js 18+
- npm
- Cuenta de Supabase

### 1. Clonar el repositorio
```bash
git clone https://github.com/dinamicoPD/Diploma_web.git
cd diplomas-web
```

### 2. Configurar Supabase
1. Crear proyecto en [Supabase Dashboard](https://app.supabase.com/)
2. Crear las siguientes tablas en SQL Editor:

```sql
-- Tabla de diseños
create table designs (
  id uuid default uuid_generate_v4() primary key,
  name text,
  data jsonb,
  medal_images jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Tabla de fuentes
create table fonts (
  id uuid default uuid_generate_v4() primary key,
  family text,
  format text,
  dataUrl text,
  fileName text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Tabla de elementos
create table elements (
  id uuid default uuid_generate_v4() primary key,
  design_id uuid references designs(id),
  type text,
  x numeric,
  y numeric,
  w numeric,
  h numeric,
  z numeric,
  properties jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Tabla de imágenes
create table images (
  id uuid default uuid_generate_v4() primary key,
  name text,
  url text,
  format text,
  width numeric,
  height numeric,
  size numeric,
  user_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);
```

3. Obtener las credenciales del proyecto (Settings > API)

### 3. Configurar Backend
```bash
cd backend
npm install
```

Crear archivo `.env` en `backend/`:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
PORT=4000
CORS_ORIGIN=http://localhost:3000
```

### 4. Configurar Frontend
```bash
cd ../diplomas-frontend
npm install
```

Crear archivo `.env.local` en `diplomas-frontend/`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## 🚀 Ejecución

### Desarrollo Local
```bash
# Backend
cd backend
npm run dev

# Frontend (en otra terminal)
cd diplomas-frontend
npm run dev
```

La aplicación estará disponible en:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000

## 📡 API Endpoints

### Diseños
- `GET /api/designs` - Listar todos los diseños
- `GET /api/designs/:id` - Obtener diseño por ID
- `POST /api/designs` - Crear nuevo diseño
- `PUT /api/designs/:id` - Actualizar diseño
- `DELETE /api/designs/:id` - Eliminar diseño

### Elementos
- `GET /api/elements` - Listar todos los elementos
- `POST /api/elements` - Crear nuevo elemento
- `PUT /api/elements/:id` - Actualizar elemento
- `DELETE /api/elements/:id` - Eliminar elemento

### Fuentes
- `GET /api/fonts` - Listar todas las fuentes
- `POST /api/fonts` - Crear nueva fuente
- `PUT /api/fonts/:id` - Actualizar fuente
- `DELETE /api/fonts/:id` - Eliminar fuente

### Imágenes
- `GET /api/images` - Listar todas las imágenes
- `POST /api/images` - Crear nueva imagen
- `DELETE /api/images/:id` - Eliminar imagen

### Subida de archivos
- `POST /api/upload/image` - Subir imagen a Cloudinary
- `POST /api/upload/font` - Subir fuente a Cloudinary

## 🔒 Seguridad

- Variables de entorno para credenciales sensibles
- Service Role Key solo en el backend
- Anon Key solo en el frontend
- CORS configurado para origen específico

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT.

---

**Nota**: Asegúrate de configurar correctamente las variables de entorno de Supabase antes de ejecutar la aplicación.
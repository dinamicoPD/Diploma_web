# Diplomas Web

Sistema de creación y gestión de diplomas digitales con editor visual y almacenamiento en la nube.

## 🚀 Características

- **Editor Visual**: Interfaz intuitiva para diseñar diplomas con elementos arrastrables
- **Gestión de Fuentes**: Soporte para fuentes personalizadas (WOFF, WOFF2, TTF, OTF)
- **Almacenamiento en Firebase**: Base de datos NoSQL y storage para archivos
- **API REST**: Backend con Express.js para operaciones CRUD
- **Responsive**: Diseño adaptativo para diferentes dispositivos

## 🛠️ Tecnologías

### Frontend
- **Next.js 14** - Framework React con App Router
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Framework CSS utilitario
- **React DnD** - Arrastrar y soltar elementos
- **Firebase Client SDK** - Conexión con servicios de Firebase

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **Firebase Firestore** - Base de datos NoSQL
- **CORS** - Manejo de solicitudes cross-origin

### Base de Datos
- **Firebase Firestore** - Base de datos en tiempo real
- **Firebase Storage** - Almacenamiento de archivos

## 📁 Estructura del Proyecto

```
diplomas-web/
├── backend/                    # API REST
│   ├── src/
│   │   ├── routes/            # Rutas de la API
│   │   │   ├── designs.js     # CRUD diseños
│   │   │   ├── elements.js    # CRUD elementos
│   │   │   ├── fonts.js       # CRUD fuentes
│   │   │   └── images.js      # CRUD imágenes
│   │   ├── models/            # Modelos de datos (legacy)
│   │   ├── db.js              # Configuración Firebase
│   │   ├── firebase.js        # Inicialización Firebase
│   │   └── server.js          # Servidor Express
│   ├── .env                   # Variables de entorno
│   └── package.json
├── diplomas-frontend/          # Aplicación Next.js
│   ├── src/
│   │   ├── app/               # App Router
│   │   ├── components/        # Componentes React
│   │   ├── lib/               # Utilidades y configuración
│   │   └── types.ts           # Tipos TypeScript
│   ├── .env.local             # Variables de entorno
│   └── package.json
├── .gitignore                 # Archivos ignorados por Git
└── README.md                  # Este archivo
```

## 🔧 Instalación y Configuración

### Prerrequisitos
- Node.js 18+
- npm o yarn
- Cuenta de Firebase

### 1. Clonar el repositorio
```bash
git clone https://github.com/dinamicoPD/Diploma_web.git
cd diplomas-web
```

### 2. Configurar Firebase
1. Crear proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Habilitar Firestore Database
3. Habilitar Firebase Storage
4. Obtener las credenciales del proyecto

### 3. Configurar Backend
```bash
cd backend
npm install
```

Crear archivo `.env` en `backend/`:
```env
# Configuración de Firebase
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id

# Puerto del servidor
PORT=4000

# CORS
CORS_ORIGIN=http://localhost:3000
```

### 4. Configurar Frontend
```bash
cd ../diplomas-frontend
npm install
```

Crear archivo `.env.local` en `diplomas-frontend/`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
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

### Despliegue en Producción (Firebase)

#### Paso 1: Login en Firebase
```bash
firebase login
```
**Correo electrónico:** `dinamico.moodle@gmail.com`

#### Paso 2: Desplegar aplicación completa
```bash
firebase deploy
```

#### Paso 3: URLs de producción
Después del despliegue, obtendrás URLs como:
- **Aplicación:** `https://diplomas-web-firebase.web.app`
- **API:** `https://us-central1-diplomas-web-firebase.cloudfunctions.net/api`

#### Paso 4: Cambiar credenciales (opcional)
Si necesitas usar un proyecto Firebase diferente:
1. Copia `.env.example` a `.env`
2. Actualiza las credenciales en `.env`
3. Actualiza el proyecto con `firebase use tu-proyecto-id`

#### Ver guía completa de despliegue
Ver el archivo [`DEPLOYMENT.md`](DEPLOYMENT.md) para instrucciones detalladas.

## 📡 API Endpoints

### Diseños
- `GET /api/designs` - Listar todos los diseños
- `GET /api/designs/:id` - Obtener diseño por ID
- `POST /api/designs` - Crear nuevo diseño
- `PUT /api/designs/:id` - Actualizar diseño
- `DELETE /api/designs/:id` - Eliminar diseño

### Elementos
- `GET /api/elements` - Listar todos los elementos
- `GET /api/elements/:id` - Obtener elemento por ID
- `POST /api/elements` - Crear nuevo elemento
- `PUT /api/elements/:id` - Actualizar elemento
- `DELETE /api/elements/:id` - Eliminar elemento

### Fuentes
- `GET /api/fonts` - Listar todas las fuentes
- `GET /api/fonts/:id` - Obtener fuente por ID
- `POST /api/fonts` - Crear nueva fuente
- `PUT /api/fonts/:id` - Actualizar fuente
- `DELETE /api/fonts/:id` - Eliminar fuente

### Imágenes
- `GET /api/images` - Listar todas las imágenes
- `GET /api/images/:id` - Obtener imagen por ID
- `POST /api/images` - Crear nueva imagen
- `PUT /api/images/:id` - Actualizar imagen
- `DELETE /api/images/:id` - Eliminar imagen

## 🔒 Seguridad

- Variables de entorno para credenciales sensibles
- Validación de entrada en endpoints
- CORS configurado para origen específico
- Archivos sensibles excluidos del repositorio (.gitignore)

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 📞 Contacto

Proyecto desarrollado para gestión de diplomas digitales.

---

**Nota**: Asegúrate de configurar correctamente las variables de entorno de Firebase antes de ejecutar la aplicación.
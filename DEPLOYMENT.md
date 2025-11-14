# 🚀 Guía de Despliegue en Firebase

## Paso 1: Configuración Inicial

### 1.1 Instalar Firebase CLI (ya completado)
```bash
npm install -g firebase-tools
```

### 1.2 Hacer login en Firebase
```bash
firebase login
```
- **Correo electrónico:** `soporte@dinamicopd.com` ✅ (ya logueado)
- Si necesitas cambiar de cuenta: `firebase logout` y luego `firebase login`
- Se abrirá el navegador para autenticación
- Selecciona la cuenta correcta
- Autoriza el acceso a Firebase

### 1.3 Verificar proyecto
```bash
firebase projects:list
```
Deberías ver tu proyecto `diplomas-web-firebase`.

## Paso 2: Despliegue del Backend (Cloud Functions)

### 2.1 Desplegar solo las funciones
```bash
firebase deploy --only functions
```

### 2.2 Verificar funciones desplegadas
```bash
firebase functions:list
```
Deberías ver la función `api` desplegada.

## Paso 3: Despliegue del Frontend (Hosting)

### 3.1 Desplegar solo el hosting
```bash
firebase deploy --only hosting
```

### 3.2 Verificar hosting desplegado
```bash
firebase hosting:channel:list
```

## Paso 4: Despliegue Completo

### 4.1 Desplegar todo (recomendado)
```bash
firebase deploy
```

Este comando desplegará:
- ✅ Cloud Functions (backend API)
- ✅ Hosting (frontend estático)

## Paso 5: Verificar Despliegue

### 5.1 Obtener URLs
```bash
firebase hosting:sites:list
```

### 5.2 URLs típicas:
- **Frontend:** `https://diplomas-web-firebase.web.app`
- **API:** `https://us-central1-diplomas-web-firebase.cloudfunctions.net/api`

## Paso 6: Configuración de Producción

### 6.1 Cambiar Credenciales de Firebase (IMPORTANTE)

#### Si usas un proyecto Firebase diferente:

**Paso 1: Obtener nuevas credenciales**
1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Inicia sesión con `dinamico.moodle@gmail.com`
3. Selecciona o crea tu proyecto
4. Ve a **Project Settings** > **General** > **Your apps**
5. Crea una nueva app web o copia las credenciales existentes

**Paso 2: Actualizar variables de entorno**
Crea un archivo `.env` en la raíz del proyecto:
```bash
cp .env.example .env
```

Edita `.env` con tus nuevas credenciales:
```env
FIREBASE_API_KEY=tu_nueva_api_key_aqui
FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
FIREBASE_PROJECT_ID=tu-proyecto-id
FIREBASE_STORAGE_BUCKET=tu-proyecto.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
FIREBASE_APP_ID=tu_app_id
```

**Paso 3: Actualizar configuración de Firebase CLI**
```bash
firebase use tu-proyecto-id
```

### 6.2 Variables de entorno en Firebase Functions
```bash
# Configurar variables de entorno para las funciones (opcional)
firebase functions:config:set \
  app.environment="production" \
  app.version="1.0.0"
```

### 6.3 Redeploy después de configuración
```bash
firebase deploy --only functions
```

## Paso 7: Monitoreo y Logs

### 7.1 Ver logs de funciones
```bash
firebase functions:log
```

### 7.2 Ver logs de hosting
```bash
firebase hosting:sites:list
```

## 🔧 Solución de Problemas

### Error: "Project not found"
```bash
firebase use diplomas-web-firebase
```

### Error: "Functions deployment failed"
```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

### Error: "Hosting deployment failed"
```bash
# Verificar que existe el directorio out
ls -la diplomas-frontend/out/
firebase deploy --only hosting
```

## 📊 Estado Actual del Proyecto

### ✅ Preparado para despliegue:
- [x] Firebase CLI instalado
- [x] Configuración `firebase.json` correcta
- [x] Cloud Functions implementadas
- [x] Frontend exportado estáticamente
- [x] Build de producción generado

### 🔄 Pendiente (requiere login manual):
- [ ] Login en Firebase
- [ ] Despliegue de funciones
- [ ] Despliegue de hosting
- [ ] Configuración de variables de entorno

## 🎯 Próximos Pasos

1. **Ejecutar:** `firebase login`
2. **Ejecutar:** `firebase deploy`
3. **Verificar:** Acceder a la URL proporcionada
4. **Probar:** Todas las funcionalidades de la aplicación

## 📞 URLs de Producción

Después del despliegue, tu aplicación estará disponible en:
- **Aplicación principal:** `https://[tu-proyecto].web.app`
- **API Backend:** `https://[region]-[tu-proyecto].cloudfunctions.net/api`

¡Tu aplicación de diplomas estará lista para uso global! 🌍
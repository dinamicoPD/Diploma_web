# 🚀 Guía de Despliegue en Vercel

## 📋 Requisitos Previos

- ✅ **Proyecto configurado** con `vercel.json`
- ✅ **Next.js** sin `output: 'export'`
- ✅ **Backend Express** listo
- ✅ **Firebase** configurado

## Paso 1: Instalar Vercel CLI

```bash
npm install -g vercel
```

**Verificar instalación:**
```bash
vercel --version
```
**Salida esperada:** `vercel/xx.x.x`

## Paso 2: Login en Vercel

```bash
vercel login
```

**Qué sucede:**
- Se abre tu navegador
- Selecciona tu cuenta `dinamico.moodle@gmail.com`
- Autoriza el acceso
- Regresa a terminal

## Paso 3: Configurar Proyecto

### Opción A: Desde Terminal (Recomendado)

```bash
# En la raíz del proyecto
vercel

# Responde las preguntas:
# - Set up and deploy? → Y
# - Which scope? → Selecciona tu cuenta
# - Link to existing project? → N (nuevo proyecto)
# - Project name → diplomas-web (o el que prefieras)
# - Directory → ./ (raíz del proyecto)
```

### Opción B: Desde GitHub (Deploy Automático)

1. Ve a [vercel.com](https://vercel.com)
2. Click "Import Project"
3. Conecta tu repo de GitHub
4. Vercel detecta automáticamente la configuración

## Paso 4: Variables de Entorno

Vercel usa las variables del `vercel.json`, pero puedes configurar adicionales:

```bash
vercel env add FIREBASE_API_KEY
# Ingresa: AIzaSyBTZKT0q_rciqYTLysU6BBJnNCDYebkmeM
```

O configúralas en el dashboard de Vercel > Project Settings > Environment Variables.

## Paso 5: Desplegar

### Deploy de Producción
```bash
vercel --prod
```

### Preview Deploy (para testing)
```bash
vercel
```

## Paso 6: URLs de Producción

Vercel te dará URLs como:
- **Aplicación:** `https://diplomas-web.vercel.app`
- **API Backend:** `https://diplomas-web.vercel.app/api/designs`

## 🔧 Configuración de Vercel (`vercel.json`)

```json
{
  "version": 2,
  "builds": [
    {
      "src": "diplomas-frontend/package.json",
      "use": "@vercel/next"
    },
    {
      "src": "backend/package.json",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/backend/src/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "/diplomas-frontend/$1"
    }
  ],
  "env": {
    "FIREBASE_API_KEY": "tu_api_key",
    "FIREBASE_PROJECT_ID": "diplomas-web-firebase"
    // ... otras variables
  }
}
```

## 📊 Costos de Vercel

### Hobby Plan (Gratis)
- ✅ **100GB bandwidth/mes**
- ✅ **100GB hours/mes**
- ✅ **1000 builds/mes**
- ✅ **Custom domains**

### Pro Plan ($20/mes)
- ✅ **3000GB bandwidth/mes**
- ✅ **5000GB hours/mes**
- ✅ **3000 builds/mes**

## 🎯 Ventajas de Vercel

- ✅ **Deploy automático** desde Git
- ✅ **Preview deployments** por PR
- ✅ **CDN global** integrado
- ✅ **SSL automático**
- ✅ **Analytics** integrado
- ✅ **Serverless functions** incluidas

## 🔍 Verificar Despliegue

### Health Check
```bash
curl https://tu-app.vercel.app/api/health
```

**Respuesta esperada:**
```json
{
  "ok": true,
  "timestamp": "2025-11-14T15:39:00.000Z"
}
```

### Acceder a la App
- Abre: `https://tu-app.vercel.app`
- Prueba todas las funcionalidades
- Verifica que la API responda

## 🚀 Próximos Pasos

1. **Configurar dominio** (opcional)
2. **Habilitar analytics** en Vercel
3. **Configurar monitoreo** de errores
4. **Optimizar performance**

## 📞 Soporte

- **Docs:** [vercel.com/docs](https://vercel.com/docs)
- **Community:** [vercel.community](https://vercel.community)
- **Status:** [vercel.status](https://vercel.status)

---

**¡Tu aplicación estará disponible globalmente en segundos!** 🌍

import type { NextConfig } from "next";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

// Archivo .env compartido en la raiz de Diploma_web
const envPath = resolve(process.cwd(), "..", ".env");

if (existsSync(envPath)) {
  process.loadEnvFile(envPath);
  console.log("Frontend: archivo .env compartido cargado");
} else {
  console.warn(
    "Frontend: no se encontro el .env de la raiz"
  );
}

const nextConfig: NextConfig = {
  // Proxy de solicitudes API hacia Express
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:4000/api/:path*",
      },
    ];
  },
};

export default nextConfig;

'use client';

// Esta página ahora es un Client Component, por eso sí puede renderizar CanvasEditor (que también es client).
import CanvasEditor from '@/components/editor/CanvasEditor';
// DIPLOMA_AUTH_UPLOAD_V1
import AuthGate from '@/components/auth/AuthGate';

// Deshabilitar prerendering para evitar inicialización de Supabase durante build
export const dynamic = 'force-dynamic';

export default function EditorPage() {
  return (
    <div className="py-4 page-content">
      <AuthGate>
        <CanvasEditor />
      </AuthGate>
    </div>
  );
}

'use client';

// Esta página ahora es un Client Component, por eso sí puede renderizar CanvasEditor (que también es client).
import CanvasEditor from '@/components/editor/CanvasEditor';

// Deshabilitar prerendering para evitar inicialización de Firebase durante build
export const dynamic = 'force-dynamic';

export default function EditorPage() {
  return (
    <div className="py-4 page-content">
      <CanvasEditor />
    </div>
  );
}

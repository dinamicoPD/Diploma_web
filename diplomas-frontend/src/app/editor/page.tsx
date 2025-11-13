'use client';

// Esta página ahora es un Client Component, por eso sí puede renderizar CanvasEditor (que también es client).
import CanvasEditor from '@/components/editor/CanvasEditor';

export default function EditorPage() {
  return (
    <div className="py-4 page-content">
      <CanvasEditor />
    </div>
  );
}

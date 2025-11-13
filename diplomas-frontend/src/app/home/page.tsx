// src/app/home/page.tsx
import DownloadTemplateButtons from '@/components/home/DownloadTemplateButtons';

export default function HomePage() {
  return (
    <main className="py-4 page-content">
      <div className="page-hero mb-4">
        <h1 className="h3 fw-bold text-brand-ink mb-1">Dinámico — Diplomas</h1>
        <p className="text-brand-ink-70 mb-0">
          Diseña, vincula datos desde Excel y exporta todos tus diplomas en un solo PDF.
        </p>
        <div className="mt-3 d-flex gap-2">
          <a className="btn btn-brand" href="/editor">Ir al Editor</a>
          <a className="btn btn-outline-brand" href="/lotes">Ir a Lotes</a>
        </div>
      </div>

      <section className="brand-card brand-section">
        <h2 className="h5 fw-semibold text-brand-ink">Cómo usar</h2>
        <ol className="mt-2 mb-0 text-brand-ink-70">
          <li>En <strong>Editor</strong>: diseña el diploma (textos, logos, medallas) y <strong>guárdalo</strong>.</li>
          <li>En <strong>Lotes</strong>: carga la hoja <em>.xlsx</em>, vincula campos a tus textos y exporta.</li>
        </ol>
      </section>

      <section className="brand-card brand-section">
        <h2 className="h5 fw-semibold text-brand-ink">Plantillas Excel</h2>
        <p className="text-brand-ink-70 mb-2">
          Descarga una plantilla de ejemplo, complétala y súbela en la página Lotes.
        </p>
        <DownloadTemplateButtons />
      </section>
    </main>
  );
}

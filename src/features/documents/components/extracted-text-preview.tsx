import type { ExtractedPage } from "@/features/documents/types/extracted-document";

type ExtractedTextPreviewProps = {
  pages: ExtractedPage[];
};

export function ExtractedTextPreview({
  pages,
}: ExtractedTextPreviewProps) {
  const hasText = pages.some((page) => page.text.trim().length > 0);

  return (
    <section
      aria-label="Texto de las páginas seleccionadas"
      className="mt-6"
    >
      <h4 className="text-base font-semibold text-slate-900">
        Vista previa del contenido
      </h4>

      {!hasText && (
        <p
          role="status"
          className="mt-3 rounded-lg bg-amber-50 p-4 text-sm leading-6 text-amber-900"
        >
          Las páginas seleccionadas no contienen texto extraíble.
          Prueba con otro rango. Si el documento está escaneado,
          esta versión todavía no incluye OCR.
        </p>
      )}

      <div className="mt-4 space-y-3">
        {pages.map((page) => (
          <details
            key={page.pageNumber}
            className="rounded-lg border border-slate-200"
          >
            <summary className="cursor-pointer rounded-lg px-4 py-3 font-medium text-slate-800 focus-visible:outline-2 focus-visible:outline-indigo-700">
              Página {page.pageNumber}
              {!page.text.trim() && " — sin texto extraíble"}
            </summary>

            <div className="max-h-80 overflow-y-auto border-t border-slate-200 p-4">
              <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                {page.text || "No se ha encontrado texto en esta página."}
              </p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
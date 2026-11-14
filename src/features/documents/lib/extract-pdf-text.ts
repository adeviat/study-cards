import type {
  ExtractedDocument,
  ExtractedPage,
} from "@/features/documents/types/extracted-document";

const MAX_PAGES = 100;

export async function extractPdfText(
  file: File,
): Promise<ExtractedDocument> {
  const pdfjs = await import("pdfjs-dist");

  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  const data = new Uint8Array(await file.arrayBuffer());

  const loadingTask = pdfjs.getDocument({
    data,
  });

  try {
    const pdf = await loadingTask.promise;

    if (pdf.numPages > MAX_PAGES) {
      throw new Error(
        `Esta primera versión admite documentos de hasta ${MAX_PAGES} páginas. Selecciona un PDF más pequeño.`,
      );
    }

    const pages: ExtractedPage[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);

      try {
        const content = await page.getTextContent();

        const text = content.items
          .map((item) => {
            if (!("str" in item)) {
              return "";
            }

            return `${item.str}${item.hasEOL ? "\n" : " "}`;
          })
          .join("")
          .replace(/[ \t]+\n/g, "\n")
          .trim();

        pages.push({
          pageNumber,
          text,
        });
      } finally {
        page.cleanup();
      }
    }

    return {
      fileName: file.name,
      pageCount: pdf.numPages,
      pages,
    };
  } finally {
    await loadingTask.destroy();
  }
}
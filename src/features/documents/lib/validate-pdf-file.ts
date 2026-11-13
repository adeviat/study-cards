export const MAX_PDF_SIZE_MIB = 10;

const MAX_PDF_SIZE_BYTES = MAX_PDF_SIZE_MIB * 1024 * 1024;

type FileMetadata = {
  name: string;
  size: number;
  type: string;
};

export function validatePdfFile(file: FileMetadata): string | null {
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return "Selecciona un archivo con extensión .pdf.";
  }

  const hasCompatibleMimeType =
    file.type === "" ||
    file.type === "application/pdf" ||
    file.type === "application/octet-stream";

  if (!hasCompatibleMimeType) {
    return "El tipo de archivo indicado no es compatible con un PDF.";
  }

  if (file.size === 0) {
    return "El archivo está vacío. Selecciona otro PDF.";
  }

  if (file.size > MAX_PDF_SIZE_BYTES) {
    return `El archivo supera el límite de ${MAX_PDF_SIZE_MIB} MiB.`;
  }

  return null;
}

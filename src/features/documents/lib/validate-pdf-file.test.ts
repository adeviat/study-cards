import { describe, expect, it } from "vitest";

import {
  MAX_PDF_SIZE_MIB,
  validatePdfFile,
} from "./validate-pdf-file";

const MAX_SIZE_BYTES = MAX_PDF_SIZE_MIB * 1024 * 1024;

type FileMetadata = Parameters<typeof validatePdfFile>[0];

function createFileMetadata(
  overrides: Partial<FileMetadata> = {},
): FileMetadata {
  return {
    name: "temario.pdf",
    size: 1024,
    type: "application/pdf",
    ...overrides,
  };
}

describe("validatePdfFile", () => {
  it("acepta un PDF con metadatos compatibles", () => {
    const result = validatePdfFile(createFileMetadata());

    expect(result).toBeNull();
  });

  it("acepta la extensión PDF en mayúsculas", () => {
    const file = createFileMetadata({
      name: "TEMARIO.PDF",
    });

    expect(validatePdfFile(file)).toBeNull();
  });

  it.each(["", "application/octet-stream"])(
    "acepta el tipo MIME vacío o genérico: %j",
    (type) => {
      const file = createFileMetadata({ type });

      expect(validatePdfFile(file)).toBeNull();
    },
  );

  it("rechaza una extensión distinta de .pdf", () => {
    const file = createFileMetadata({
      name: "temario.txt",
    });

    expect(validatePdfFile(file)).toBe(
      "Selecciona un archivo con extensión .pdf.",
    );
  });

  it("rechaza una extensión engañosa que no termina en .pdf", () => {
    const file = createFileMetadata({
      name: "temario.pdf.exe",
    });

    expect(validatePdfFile(file)).toBe(
      "Selecciona un archivo con extensión .pdf.",
    );
  });

  it("rechaza un tipo MIME incompatible", () => {
    const file = createFileMetadata({
      type: "image/png",
    });

    expect(validatePdfFile(file)).toBe(
      "El tipo de archivo indicado no es compatible con un PDF.",
    );
  });

  it("rechaza un archivo vacío", () => {
    const file = createFileMetadata({
      size: 0,
    });

    expect(validatePdfFile(file)).toBe(
      "El archivo está vacío. Selecciona otro PDF.",
    );
  });

  it("acepta un archivo con el tamaño máximo exacto", () => {
    const file = createFileMetadata({
      size: MAX_SIZE_BYTES,
    });

    expect(validatePdfFile(file)).toBeNull();
  });

  it("rechaza un archivo que supera el máximo en un byte", () => {
    const file = createFileMetadata({
      size: MAX_SIZE_BYTES + 1,
    });

    expect(validatePdfFile(file)).toBe(
      `El archivo supera el límite de ${MAX_PDF_SIZE_MIB} MiB.`,
    );
  });
});
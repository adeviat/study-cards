"use client";

import { useId, useRef, useState } from "react";
import type { ChangeEvent } from "react";

import { extractPdfText } from "@/features/documents/lib/extract-pdf-text";
import {
  MAX_PDF_SIZE_MIB,
  validatePdfFile,
} from "@/features/documents/lib/validate-pdf-file";
import type { ExtractedDocument } from "@/features/documents/types/extracted-document";
import { PageRangeSelector } from "@/features/documents/components/page-range-selector";


function getReadingError(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === "PasswordException") {
      return "Este PDF requiere una contraseña. Por ahora, selecciona uno sin protección.";
    }

    if (error.name === "InvalidPDFException") {
      return "No se ha podido abrir el archivo como un PDF válido.";
    }

    if (error.message.startsWith("Esta primera versión admite")) {
      return error.message;
    }
  }

  return "No se ha podido leer el documento. Prueba con otro PDF.";
}

export function PdfSelector() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [document, setDocument] = useState<ExtractedDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const inputId = useId();
  const helpId = useId();
  const errorId = useId();

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];

    if (!file) {
      return;
    }

    const validationError = validatePdfFile(file);

    setError(validationError);
    setSelectedFile(validationError ? null : file);
    setDocument(null);

    event.currentTarget.value = "";
  }

  function handleRemoveFile() {
    setSelectedFile(null);
    setDocument(null);
    setError(null);

    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.focus();
    }
  }

  async function handleReadDocument() {
    if (!selectedFile || isReading) {
      return;
    }

    setIsReading(true);
    setError(null);
    setDocument(null);

    try {
      const result = await extractPdfText(selectedFile);
      setDocument(result);
    } catch (readingError) {
      console.error("Error al leer el PDF:", readingError);
      setError(getReadingError(readingError));
    } finally {
      setIsReading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <label
        htmlFor={inputId}
        className="block text-base font-semibold text-slate-900"
      >
        Selecciona tu documento PDF
      </label>

      <p
        id={helpId}
        className="mt-2 text-sm leading-6 text-slate-600"
      >
        Un archivo .pdf de hasta {MAX_PDF_SIZE_MIB} MiB y 100 páginas.
        La lectura del PDF se realiza en tu navegador. Solo si después
        pulsas «Enviar texto y preparar demostración», enviaremos el
        texto seleccionado al servidor de esta aplicación.
      </p>


      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept=".pdf,application/pdf"
        disabled={isReading}
        aria-describedby={error ? `${helpId} ${errorId}` : helpId}
        aria-invalid={Boolean(error)}
        onChange={handleFileChange}
        className="mt-5 block w-full min-w-0 rounded-lg border border-slate-300 p-3 text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-700 disabled:cursor-wait disabled:opacity-60"
      />

      <div
        id={errorId}
        role="alert"
        className="mt-3 text-sm text-red-700"
      >
        {error}
      </div>

      {selectedFile && (
        <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
          <p className="font-medium text-slate-900">
            Archivo seleccionado
          </p>

          <p className="mt-2 break-all text-sm text-slate-700">
            {selectedFile.name}
          </p>

          <p className="mt-1 text-sm text-slate-600">
            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MiB
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleReadDocument}
              disabled={isReading}
              className="min-h-11 rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-700 disabled:cursor-wait disabled:opacity-60"
            >
              {isReading ? "Leyendo documento…" : "Leer documento"}
            </button>

            <button
              type="button"
              onClick={handleRemoveFile}
              disabled={isReading}
              className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-700 disabled:cursor-wait disabled:opacity-60"
            >
              Quitar archivo
            </button>
          </div>
        </div>
      )}

      <p role="status" className="mt-4 text-sm text-slate-600">
        {isReading
          ? "Extrayendo el texto de las páginas. Espera un momento."
          : document
            ? `Lectura terminada: ${document.pageCount} páginas.`
            : !selectedFile
              ? "No hay ningún documento seleccionado."
              : "Documento preparado para su lectura."}
      </p>

      {document && (
        <PageRangeSelector document={document} />
      )}
    </div>
  );
}
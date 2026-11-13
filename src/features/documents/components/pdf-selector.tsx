"use client";

import { useId, useRef, useState } from "react";
import type { ChangeEvent } from "react";

import {
  MAX_PDF_SIZE_MIB,
  validatePdfFile,
} from "@/features/documents/lib/validate-pdf-file";

export function PdfSelector() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

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

    // Permite volver a seleccionar el mismo archivo.
    event.currentTarget.value = "";
  }

  function handleRemoveFile() {
    setSelectedFile(null);
    setError(null);

    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.focus();
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
        Un archivo .pdf de hasta {MAX_PDF_SIZE_MIB} MiB. En esta etapa
        no se envía a ningún servidor.
      </p>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept=".pdf,application/pdf"
        aria-describedby={
          error ? `${helpId} ${errorId}` : helpId
        }
        aria-invalid={Boolean(error)}
        onChange={handleFileChange}
        className="mt-5 block w-full min-w-0 rounded-lg border border-slate-300 p-3 text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-700"
      />

      <div
        id={errorId}
        role="alert"
        className="mt-3 text-sm text-red-700"
      >
        {error}
      </div>

      <div role="status" className="mt-4">
        {selectedFile ? (
          <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
            <p className="font-medium text-slate-900">
              Archivo seleccionado
            </p>

            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="font-medium text-slate-700">
                  Nombre
                </dt>
                <dd className="mt-1 break-all text-slate-600">
                  {selectedFile.name}
                </dd>
              </div>

              <div>
                <dt className="font-medium text-slate-700">
                  Tamaño
                </dt>
                <dd className="mt-1 text-slate-600">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MiB
                  {" · "}
                  {selectedFile.size} bytes
                </dd>
              </div>
            </dl>

            <p className="mt-4 text-sm leading-6 text-slate-600">
              Pendiente de lectura. Todavía no hemos comprobado el
              contenido del documento.
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            No hay ningún documento seleccionado.
          </p>
        )}
      </div>

      {selectedFile && (
        <button
          type="button"
          onClick={handleRemoveFile}
          className="mt-4 min-h-11 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-700"
        >
          Quitar archivo
        </button>
      )}
    </div>
  );
}
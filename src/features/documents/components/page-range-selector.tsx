"use client";

import { useId, useState } from "react";
import type { FormEvent } from "react";

import { ExtractedTextPreview } from "@/features/documents/components/extracted-text-preview";
import { validatePageRange } from "@/features/documents/lib/validate-page-range";
import type { PageRange } from "@/features/documents/lib/validate-page-range";
import type { ExtractedDocument } from "@/features/documents/types/extracted-document";
import { FlashcardPreparationPanel } from "@/features/flashcards/components/flashcard-preparation-panel";

type PageRangeSelectorProps = {
  document: ExtractedDocument;
};

export function PageRangeSelector({
  document,
}: PageRangeSelectorProps) {
  const [fromValue, setFromValue] = useState("1");
  const [toValue, setToValue] = useState(String(document.pageCount));

  const [appliedRange, setAppliedRange] = useState<PageRange | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fromId = useId();
  const toId = useId();
  const helpId = useId();
  const errorId = useId();

  function handleApplyRange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const range: PageRange = {
      from: fromValue.trim() === "" ? Number.NaN : Number(fromValue),
      to: toValue.trim() === "" ? Number.NaN : Number(toValue),
    };

    const validationError = validatePageRange(
      range,
      document.pageCount,
    );

    setError(validationError);

    if (validationError) {
      setAppliedRange(null);
      return;
    }

    setAppliedRange(range);
  }

  const selectedPages = appliedRange
    ? document.pages.filter(
        (page) =>
          page.pageNumber >= appliedRange.from &&
          page.pageNumber <= appliedRange.to,
      )
    : [];

  const hasPendingChanges =
    appliedRange !== null &&
    (Number(fromValue) !== appliedRange.from ||
      Number(toValue) !== appliedRange.to);

  const describedBy = error
    ? `${helpId} ${errorId}`
    : helpId;

  return (
    <section
      aria-label="Selección de páginas"
      className="mt-6 border-t border-slate-200 pt-6"
    >
      <h3 className="text-lg font-semibold text-slate-900">
        ¿Qué páginas quieres estudiar?
      </h3>

      <p
        id={helpId}
        className="mt-2 text-sm leading-6 text-slate-600"
      >
        El documento tiene {document.pageCount} páginas. El rango
        incluye la página inicial y la final. Usamos su posición
        dentro del PDF, no la numeración impresa en el documento.
      </p>

      <form
        onSubmit={handleApplyRange}
        noValidate
        className="mt-5"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor={fromId}
              className="block text-sm font-medium text-slate-800"
            >
              Desde la página
            </label>

            <input
              id={fromId}
              type="number"
              min={1}
              max={document.pageCount}
              step={1}
              required
              value={fromValue}
              onChange={(event) => {
                setFromValue(event.target.value);
                setError(null);
              }}
              aria-describedby={describedBy}
              aria-invalid={Boolean(error)}
              className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700"
            />
          </div>

          <div>
            <label
              htmlFor={toId}
              className="block text-sm font-medium text-slate-800"
            >
              Hasta la página
            </label>

            <input
              id={toId}
              type="number"
              min={1}
              max={document.pageCount}
              step={1}
              required
              value={toValue}
              onChange={(event) => {
                setToValue(event.target.value);
                setError(null);
              }}
              aria-describedby={describedBy}
              aria-invalid={Boolean(error)}
              className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700"
            />
          </div>
        </div>

        <p
          id={errorId}
          role="alert"
          className="mt-3 text-sm text-red-700"
        >
          {error}
        </p>

        <button
          type="submit"
          className="mt-4 min-h-11 rounded-lg bg-indigo-700 px-5 py-3 text-sm font-medium text-white hover:bg-indigo-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-700"
        >
          Aplicar selección
        </button>
      </form>

      <div role="status" className="mt-4 text-sm text-slate-600">
        {appliedRange ? (
          <p>
            Selección aplicada: páginas {appliedRange.from} a{" "}
            {appliedRange.to}. Total: {selectedPages.length} páginas.
          </p>
        ) : (
          <p>
            Todavía no has aplicado una selección de páginas.
          </p>
        )}

        {hasPendingChanges && (
          <p className="mt-2 text-amber-800">
            Hay cambios sin aplicar. La vista previa sigue mostrando
            el último rango confirmado.
          </p>
        )}
      </div>

      {appliedRange && (
        <ExtractedTextPreview
          key={`preview-${appliedRange.from}-${appliedRange.to}`}
          pages={selectedPages}
        />
      )}

      {appliedRange && !hasPendingChanges && (
        <FlashcardPreparationPanel
          key={`preparation-${appliedRange.from}-${appliedRange.to}`}
          pages={selectedPages}
        />
      )}
    </section>
  );
}
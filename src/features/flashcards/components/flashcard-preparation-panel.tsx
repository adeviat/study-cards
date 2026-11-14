"use client";

import { useState } from "react";

import type { ExtractedPage } from "@/features/documents/types/extracted-document";
import { FlashcardItem } from "@/features/flashcards/components/flashcard-item";
import { prepareDemoFlashcards } from "@/features/flashcards/lib/prepare-demo-flashcards";
import type { Flashcard } from "@/features/flashcards/types/flashcard";

type FlashcardPreparationPanelProps = {
  pages: ExtractedPage[];
};

type PreparationState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; cards: Flashcard[] }
  | { status: "error"; message: string };

export function FlashcardPreparationPanel({
  pages,
}: FlashcardPreparationPanelProps) {
  const [state, setState] = useState<PreparationState>({
    status: "idle",
  });

  const hasText = pages.some((page) => page.text.trim().length > 0);
  const isLoading = state.status === "loading";

  async function handlePrepareCards() {
    if (isLoading || !hasText) {
      return;
    }

    setState({ status: "loading" });

    try {
      const cards = await prepareDemoFlashcards(pages);

      setState({
        status: "success",
        cards,
      });
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se han podido preparar las tarjetas.",
      });
    }
  }

  return (
    <section
      aria-label="Preparación de tarjetas de demostración"
      className="mt-8 border-t border-slate-200 pt-6"
    >
      <h4 className="text-lg font-semibold text-slate-900">
        Prepara tus tarjetas
      </h4>

      <p className="mt-3 rounded-lg bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        Modo de demostración: se mostrarán dos tarjetas de ejemplo.
        No se generan preguntas a partir del PDF ni se envía su
        contenido a ningún servicio.
      </p>

      <p className="mt-4 text-sm text-slate-600">
        Páginas del rango confirmado: {pages.length}.
      </p>

      <button
        type="button"
        onClick={handlePrepareCards}
        disabled={isLoading || !hasText}
        className="mt-4 min-h-11 rounded-lg bg-indigo-700 px-5 py-3 text-sm font-medium text-white hover:bg-indigo-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading
          ? "Preparando demostración…"
          : state.status === "success"
            ? "Reiniciar demostración"
            : "Preparar tarjetas de demostración"}
      </button>

      {!hasText && (
        <p className="mt-3 text-sm text-amber-800">
          Selecciona un rango con texto extraíble para continuar.
        </p>
      )}

      <p role="status" className="mt-3 text-sm text-slate-600">
        {state.status === "loading"
          ? "Preparando las tarjetas de ejemplo."
          : state.status === "success"
            ? `Demostración preparada: ${state.cards.length} tarjetas.`
            : ""}
      </p>

      <p role="alert" className="mt-3 text-sm text-red-700">
        {state.status === "error" ? state.message : ""}
      </p>

      {state.status === "success" && (
        <ul className="mt-6 space-y-5">
          {state.cards.map((card) => (
            <li key={card.id}>
              <FlashcardItem card={card} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
"use client";

import { useId, useState } from "react";
import type { FormEvent } from "react";

import type { ExtractedPage } from "@/features/documents/types/extracted-document";
import { FlashcardItem } from "@/features/flashcards/components/flashcard-item";
import { buildGenerationRequest } from "@/features/flashcards/lib/build-generation-request";
import { prepareDemoFlashcards } from "@/features/flashcards/lib/prepare-demo-flashcards";
import { GENERATION_LIMITS } from "@/features/flashcards/schemas/generation-contract";
import type { Flashcard } from "@/features/flashcards/types/flashcard";

import { validateGenerationOnServer } from "@/features/flashcards/lib/validate-generation-on-server";

type FlashcardPreparationPanelProps = {
  pages: ExtractedPage[];
};

type PreparationState =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "success";
      cards: Flashcard[];
      requestedCount: number;
    }
  | { status: "error"; message: string };

export function FlashcardPreparationPanel({
  pages,
}: FlashcardPreparationPanelProps) {
  const [cardCountValue, setCardCountValue] = useState("5");
  const [state, setState] = useState<PreparationState>({
    status: "idle",
  });

  const cardCountId = useId();
  const helpId = useId();
  const errorId = useId();

  const isLoading = state.status === "loading";

  const pagesWithText = pages.filter(
    (page) => page.text.trim().length > 0,
  );

  const characterCount = pagesWithText.reduce(
    (total, page) => total + page.text.trim().length,
    0,
  );

  async function handlePrepareCards(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    const requestResult = buildGenerationRequest(
      pages,
      cardCountValue,
    );

    if (!requestResult.success) {
      setState({
        status: "error",
        message: requestResult.error,
      });

      return;
    }

    const request = requestResult.data;

    setState({ status: "loading" });

    try {
      await validateGenerationOnServer(request);

      const cards = await prepareDemoFlashcards(request.pages);

      setState({
        status: "success",
        cards,
        requestedCount: request.cardCount,
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
        Modo de demostración: al pulsar el botón, enviaremos el texto de
        las páginas seleccionadas al servidor de esta aplicación para
        validarlo. No enviamos el archivo PDF ni llamamos a proveedores
        de IA. Después mostraremos dos ejemplos fijos, no preguntas
        generadas a partir del documento.
      </p>


      <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="font-medium text-slate-800">
            Páginas seleccionadas
          </dt>
          <dd className="mt-1 text-slate-600">
            {pages.length}
          </dd>
        </div>

        <div>
          <dt className="font-medium text-slate-800">
            Páginas con texto
          </dt>
          <dd className="mt-1 text-slate-600">
            {pagesWithText.length} / {GENERATION_LIMITS.maxPages}
          </dd>
        </div>

        <div>
          <dt className="font-medium text-slate-800">
            Caracteres del contenido
          </dt>
          <dd className="mt-1 text-slate-600">
            {characterCount} / {GENERATION_LIMITS.maxCharacters}
          </dd>
        </div>
      </dl>

      <form
        onSubmit={handlePrepareCards}
        noValidate
        className="mt-6"
      >
        <label
          htmlFor={cardCountId}
          className="block text-sm font-medium text-slate-800"
        >
          Cantidad de tarjetas
        </label>

        <p
          id={helpId}
          className="mt-2 text-sm leading-6 text-slate-600"
        >
          Elige de 1 a {GENERATION_LIMITS.maxCards} tarjetas para la
          futura generación real. La demostración siempre muestra
          dos ejemplos.
        </p>

        <input
          id={cardCountId}
          type="number"
          min={1}
          max={GENERATION_LIMITS.maxCards}
          step={1}
          required
          disabled={isLoading}
          value={cardCountValue}
          onChange={(event) => {
            setCardCountValue(event.target.value);
            setState({ status: "idle" });
          }}
          aria-describedby={`${helpId} ${errorId}`}
          className="mt-3 block min-h-11 w-full max-w-40 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700 disabled:opacity-60"
        />

        <button
          type="submit"
          disabled={isLoading}
          className="mt-4 min-h-11 rounded-lg bg-indigo-700 px-5 py-3 text-sm font-medium text-white hover:bg-indigo-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-700 disabled:cursor-wait disabled:opacity-60"
        >
          {isLoading
            ? "Validando y preparando…"
            : state.status === "success"
              ? "Revalidar y reiniciar demostración"
              : "Enviar texto y preparar demostración"}

        </button>

        <p
          id={errorId}
          role="alert"
          className="mt-3 text-sm text-red-700"
        >
          {state.status === "error" ? state.message : ""}
        </p>
      </form>

      <p role="status" className="mt-3 text-sm text-slate-600">
        {state.status === "loading"
          ? "Validando la solicitud con el servidor y preparando los ejemplos."
          : state.status === "success"
            ? `Solicitud validada en el servidor para ${state.requestedCount} tarjetas. Se muestran ${state.cards.length} ejemplos fijos, no un resultado de generación.`
            : ""}
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
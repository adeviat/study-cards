"use client";

import { useId, useState } from "react";

import type { Flashcard } from "@/features/flashcards/types/flashcard";

type FlashcardItemProps = {
  card: Flashcard;
};

export function FlashcardItem({ card }: FlashcardItemProps) {
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);

  const questionId = useId();
  const answerId = useId();

  return (
    <article
      aria-labelledby={questionId}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <p className="text-sm font-medium text-indigo-700">
        Tarjeta de ejemplo
      </p>

      <h2
        id={questionId}
        className="mt-3 text-2xl font-semibold leading-snug text-slate-900"
      >
        {card.question}
      </h2>

      <div id={answerId} hidden={!isAnswerVisible}>
        <div className="mt-6 rounded-xl bg-slate-50 p-5">
          <h3 className="text-sm font-semibold text-slate-900">
            Respuesta
          </h3>

          <p className="mt-2 leading-7 text-slate-700">
            {card.answer}
          </p>
        </div>
      </div>

      <button
        type="button"
        aria-expanded={isAnswerVisible}
        aria-controls={answerId}
        onClick={() => setIsAnswerVisible((previous) => !previous)}
        className="mt-6 min-h-11 rounded-lg bg-indigo-700 px-5 py-3 font-medium text-white transition-colors hover:bg-indigo-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-700"
      >
        {isAnswerVisible ? "Ocultar respuesta" : "Mostrar respuesta"}
      </button>
    </article>
  );
}
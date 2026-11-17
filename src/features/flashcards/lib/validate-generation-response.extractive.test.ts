import { describe, expect, it } from "vitest";

import { validateGenerationResponse } from "./validate-generation-response";
import type { GenerationRequest } from "../schemas/generation-contract";

const stackExcerpt =
  "Una pila sigue el principio LIFO: el último elemento en entrar es el primero en salir.";

const queueExcerpt =
  "Una cola sigue el principio FIFO: el primer elemento en entrar es el primero en salir.";

const request: GenerationRequest = {
  pages: [
    {
      pageNumber: 1,
      text: `${stackExcerpt} ${queueExcerpt}`,
    },
  ],
  cardCount: 2,
};

describe("validación de respuestas extractivas", () => {
  it("rechaza una respuesta FIFO respaldada con una cita de LIFO", () => {
    const result = validateGenerationResponse(
      {
        cards: [
          {
            question: "¿Qué principio sigue una cola?",
            answer: "el primer elemento en entrar es el primero en salir",
            sourcePage: 1,
            sourceExcerpt: stackExcerpt,
          },
        ],
      },
      request,
    );

    expect(result).toEqual({
      success: false,
      error:
        "La respuesta de la tarjeta 1 no aparece literalmente en su fragmento de referencia.",
    });
  });

  it("acepta una respuesta que aparece en la cita correcta", () => {
    const result = validateGenerationResponse(
      {
        cards: [
          {
            question: "¿Qué principio sigue una cola?",
            answer: "el primer elemento en entrar es el primero en salir",
            sourcePage: 1,
            sourceExcerpt: queueExcerpt,
          },
        ],
      },
      request,
    );

    expect(result.success).toBe(true);
  });

  it("permite diferencias de espacios y saltos de línea", () => {
    const result = validateGenerationResponse(
      {
        cards: [
          {
            question: "¿Qué principio sigue una cola?",
            answer:
              "el primer elemento en entrar\nes el primero en salir",
            sourcePage: 1,
            sourceExcerpt: queueExcerpt,
          },
        ],
      },
      request,
    );

    expect(result.success).toBe(true);
  });

  it("rechaza una paráfrasis aunque tenga un significado parecido", () => {
    const result = validateGenerationResponse(
      {
        cards: [
          {
            question: "¿Cómo salen los elementos de una cola?",
            answer: "Salen en el mismo orden en que entraron.",
            sourcePage: 1,
            sourceExcerpt: queueExcerpt,
          },
        ],
      },
      request,
    );

    expect(result.success).toBe(false);
  });
});
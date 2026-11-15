import { describe, expect, it } from "vitest";

import type {
  GeneratedCard,
  GenerationRequest,
} from "../schemas/generation-contract";

import { validateGenerationResponse } from "./validate-generation-response";

const request: GenerationRequest = {
  pages: [
    {
      pageNumber: 4,
      text: "La memoria RAM almacena temporalmente datos e instrucciones.",
    },
  ],
  cardCount: 2,
};

function createCard(
  overrides: Partial<GeneratedCard> = {},
): GeneratedCard {
  return {
    question: "¿Qué almacena temporalmente la memoria RAM?",
    answer: "Datos e instrucciones.",
    sourcePage: 4,
    sourceExcerpt: "La memoria RAM almacena temporalmente datos e instrucciones.",
    ...overrides,
  };
}

describe("validateGenerationResponse", () => {
  it("acepta tarjetas con referencias presentes en la solicitud", () => {
    const result = validateGenerationResponse(
      { cards: [createCard()] },
      request,
    );

    expect(result.success).toBe(true);
  });

  it("rechaza una estructura inválida", () => {
    const result = validateGenerationResponse(
      { cards: [{ question: "Sin respuesta ni fuente" }] },
      request,
    );

    expect(result.success).toBe(false);
  });

  it("rechaza más tarjetas de las solicitadas", () => {
    const result = validateGenerationResponse(
      {
        cards: [
          createCard(),
          createCard({ question: "Segunda pregunta" }),
          createCard({ question: "Tercera pregunta" }),
        ],
      },
      request,
    );

    expect(result).toEqual({
      success: false,
      error: "La respuesta contiene más tarjetas de las solicitadas.",
    });
  });

  it("rechaza una página no enviada", () => {
    const result = validateGenerationResponse(
      { cards: [createCard({ sourcePage: 5 })] },
      request,
    );

    expect(result).toEqual({
      success: false,
      error: "La tarjeta 1 cita una página que no se envió.",
    });
  });

  it("rechaza un fragmento que no aparece en la página", () => {
    const result = validateGenerationResponse(
      {
        cards: [
          createCard({
            sourceExcerpt: "Este fragmento no existe en la página.",
          }),
        ],
      },
      request,
    );

    expect(result).toEqual({
      success: false,
      error: "El fragmento de la tarjeta 1 no aparece en la página citada.",
    });
  });

  it("tolera diferencias en espacios y saltos de línea", () => {
    const result = validateGenerationResponse(
      {
        cards: [
          createCard({
            sourceExcerpt: "La memoria RAM\nalmacena   temporalmente",
          }),
        ],
      },
      request,
    );

    expect(result.success).toBe(true);
  });

  it("rechaza preguntas repetidas ignorando mayúsculas y espacios", () => {
    const result = validateGenerationResponse(
      {
        cards: [
          createCard({ question: "¿Qué almacena la RAM?" }),
          createCard({ question: "¿QUÉ   ALMACENA LA RAM?" }),
        ],
      },
      request,
    );

    expect(result).toEqual({
      success: false,
      error: "La respuesta contiene preguntas repetidas.",
    });
  });

  it("rechaza una solicitud inválida aunque tenga tipo TypeScript", () => {
    const result = validateGenerationResponse(
      { cards: [createCard()] },
      { ...request, cardCount: 0 },
    );

    expect(result).toEqual({
      success: false,
      error: "La solicitud de generación no es válida.",
    });
  });
});
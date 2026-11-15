import { describe, expect, it } from "vitest";

import {
  GENERATION_LIMITS,
  generationRequestSchema,
  generationResponseSchema,
} from "./generation-contract";

function createRequest() {
  return {
    pages: [
      {
        pageNumber: 4,
        text: "Contenido de ejemplo para estudiar.",
      },
    ],
    cardCount: 2,
  };
}

function createResponse() {
  return {
    cards: [
      {
        question: "¿Qué tipo de contenido se presenta?",
        answer: "Contenido de ejemplo para estudiar.",
        sourcePage: 4,
        sourceExcerpt: "Contenido de ejemplo",
      },
    ],
  };
}

describe("generationRequestSchema", () => {
  it("acepta una solicitud válida", () => {
    expect(
      generationRequestSchema.safeParse(createRequest()).success,
    ).toBe(true);
  });

  it("rechaza una solicitud sin páginas", () => {
    const request = {
      ...createRequest(),
      pages: [],
    };

    expect(generationRequestSchema.safeParse(request).success).toBe(false);
  });

  it("rechaza páginas sin texto", () => {
    const request = {
      ...createRequest(),
      pages: [{ pageNumber: 1, text: "   " }],
    };

    expect(generationRequestSchema.safeParse(request).success).toBe(false);
  });

  it("rechaza páginas repetidas", () => {
    const request = createRequest();
    request.pages.push({ ...request.pages[0]! });

    expect(generationRequestSchema.safeParse(request).success).toBe(false);
  });

  it("rechaza más páginas que el máximo", () => {
    const request = {
      ...createRequest(),
      pages: Array.from(
        { length: GENERATION_LIMITS.maxPages + 1 },
        (_, index) => ({
          pageNumber: index + 1,
          text: "Contenido.",
        }),
      ),
    };

    expect(generationRequestSchema.safeParse(request).success).toBe(false);
  });

  it("acepta el máximo exacto de caracteres", () => {
    const request = {
      ...createRequest(),
      pages: [
        {
          pageNumber: 1,
          text: "a".repeat(GENERATION_LIMITS.maxCharacters),
        },
      ],
    };

    expect(generationRequestSchema.safeParse(request).success).toBe(true);
  });

  it("rechaza un carácter por encima del máximo", () => {
    const request = {
      ...createRequest(),
      pages: [
        {
          pageNumber: 1,
          text: "a".repeat(GENERATION_LIMITS.maxCharacters + 1),
        },
      ],
    };

    expect(generationRequestSchema.safeParse(request).success).toBe(false);
  });

  it.each([0, 11, 1.5])(
    "rechaza una cantidad de tarjetas inválida: %s",
    (cardCount) => {
      const request = { ...createRequest(), cardCount };

      expect(generationRequestSchema.safeParse(request).success).toBe(false);
    },
  );
});

describe("generationResponseSchema", () => {
  it("acepta una respuesta válida", () => {
    expect(
      generationResponseSchema.safeParse(createResponse()).success,
    ).toBe(true);
  });

  it("rechaza una respuesta sin tarjetas", () => {
    expect(
      generationResponseSchema.safeParse({ cards: [] }).success,
    ).toBe(false);
  });

  it("rechaza tarjetas sin referencia a la fuente", () => {
    const response = {
      cards: [{ question: "Pregunta", answer: "Respuesta" }],
    };

    expect(generationResponseSchema.safeParse(response).success).toBe(false);
  });

  it("rechaza propiedades inesperadas", () => {
    const response = {
      ...createResponse(),
      unexpected: true,
    };

    expect(generationResponseSchema.safeParse(response).success).toBe(false);
  });

  it("rechaza respuestas que no son objetos", () => {
    expect(
      generationResponseSchema.safeParse("respuesta de texto libre").success,
    ).toBe(false);
  });
});
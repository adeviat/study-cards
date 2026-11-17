import {
  generationRequestSchema,
  generationResponseSchema,
} from "../schemas/generation-contract";

import type {
  GenerationRequest,
  GenerationResponse,
} from "../schemas/generation-contract";

type ValidationResult =
  | {
      success: true;
      data: GenerationResponse;
    }
  | {
      success: false;
      error: string;
    };

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function validateGenerationResponse(
  input: unknown,
  request: GenerationRequest,
): ValidationResult {
  const requestResult = generationRequestSchema.safeParse(request);

  if (!requestResult.success) {
    return {
      success: false,
      error: "La solicitud de generación no es válida.",
    };
  }

  const responseResult = generationResponseSchema.safeParse(input);

  if (!responseResult.success) {
    return {
      success: false,
      error: "La respuesta no cumple el formato de tarjetas esperado.",
    };
  }

  const validRequest = requestResult.data;
  const response = responseResult.data;

  if (response.cards.length > validRequest.cardCount) {
    return {
      success: false,
      error: "La respuesta contiene más tarjetas de las solicitadas.",
    };
  }

  const pageTexts = new Map(
    validRequest.pages.map((page) => [
      page.pageNumber,
      normalizeWhitespace(page.text),
    ]),
  );

  const seenQuestions = new Set<string>();

  for (const [index, card] of response.cards.entries()) {
    const cardNumber = index + 1;
    const pageText = pageTexts.get(card.sourcePage);

    if (pageText === undefined) {
      return {
        success: false,
        error: `La tarjeta ${cardNumber} cita una página que no se envió.`,
      };
    }

    const excerpt = normalizeWhitespace(card.sourceExcerpt);

    if (!pageText.includes(excerpt)) {
      return {
        success: false,
        error: `El fragmento de la tarjeta ${cardNumber} no aparece en la página citada.`,
      };
    }

    const answer = normalizeWhitespace(card.answer);

    if (!excerpt.includes(answer)) {
      return {
        success: false,
        error: `La respuesta de la tarjeta ${cardNumber} no aparece literalmente en su fragmento de referencia.`,
      };
    }

    const questionKey = normalizeWhitespace(
      card.question,
    ).toLowerCase();

    if (seenQuestions.has(questionKey)) {
      return {
        success: false,
        error: "La respuesta contiene preguntas repetidas.",
      };
    }

    seenQuestions.add(questionKey);
  }

  return {
    success: true,
    data: response,
  };
}
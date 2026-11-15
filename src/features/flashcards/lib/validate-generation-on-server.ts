import { z } from "zod";

import type { GenerationRequest } from "../schemas/generation-contract";

const validationSummarySchema = z.strictObject({
  status: z.literal("validated"),
  summary: z.strictObject({
    pageCount: z.number().int().positive(),
    characterCount: z.number().int().nonnegative(),
    requestedCardCount: z.number().int().positive(),
  }),
});

const serverErrorSchema = z.object({
  error: z.object({
    message: z.string().min(1),
  }),
});

export async function validateGenerationOnServer(
  request: GenerationRequest,
) {
  let response: Response;

  try {
    response = await fetch("/api/flashcards/validate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
      cache: "no-store",
    });
  } catch {
    throw new Error(
      "No se ha podido conectar con el servidor. Comprueba la conexión e inténtalo de nuevo.",
    );
  }

  let body: unknown;

  try {
    body = await response.json();
  } catch {
    throw new Error(
      "El servidor ha devuelto una respuesta que no es JSON válido.",
    );
  }

  if (!response.ok) {
    const errorResult = serverErrorSchema.safeParse(body);

    throw new Error(
      errorResult.success
        ? errorResult.data.error.message
        : "El servidor no ha podido validar la solicitud.",
    );
  }

  const result = validationSummarySchema.safeParse(body);

  if (!result.success) {
    throw new Error(
      "La respuesta del servidor no tiene el formato esperado.",
    );
  }

  const expectedCharacterCount = request.pages.reduce(
    (total, page) => total + page.text.trim().length,
    0,
  );

  const { summary } = result.data;

  if (
    summary.pageCount !== request.pages.length ||
    summary.characterCount !== expectedCharacterCount ||
    summary.requestedCardCount !== request.cardCount
  ) {
    throw new Error(
      "El resumen del servidor no coincide con la solicitud enviada.",
    );
  }

  return summary;
}
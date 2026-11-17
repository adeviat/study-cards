import { generationRequestSchema } from "../../../../features/flashcards/schemas/generation-contract";
import { generateFlashcards } from "../../../../features/flashcards/server/generate-flashcards.server";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 128 * 1024;

function errorResponse(
  status: number,
  code: string,
  message: string,
): Response {
  return Response.json(
    {
      error: {
        code,
        message,
      },
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

export async function POST(request: Request): Promise<Response> {
  const isEnabled =
    process.env.AI_GENERATION_ENABLED === "true" &&
    process.env.NODE_ENV === "development";

  if (!isEnabled) {
    return errorResponse(
      503,
      "GENERATION_DISABLED",
      "La generación real está desactivada.",
    );
  }

  const contentType = request.headers
    .get("content-type")
    ?.split(";")[0]
    ?.trim()
    .toLowerCase();

  if (contentType !== "application/json") {
    return errorResponse(
      415,
      "UNSUPPORTED_MEDIA_TYPE",
      "La petición debe utilizar application/json.",
    );
  }

  const contentLength = request.headers.get("content-length");

  if (contentLength !== null) {
    const declaredBytes = Number(contentLength);

    if (
      Number.isFinite(declaredBytes) &&
      declaredBytes > MAX_BODY_BYTES
    ) {
      return errorResponse(
        413,
        "REQUEST_TOO_LARGE",
        "La petición supera el tamaño permitido.",
      );
    }
  }

  let body: unknown;

  try {
    const rawBody = await request.text();

    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
      return errorResponse(
        413,
        "REQUEST_TOO_LARGE",
        "La petición supera el tamaño permitido.",
      );
    }

    body = JSON.parse(rawBody);
  } catch {
    return errorResponse(
      400,
      "INVALID_JSON",
      "El cuerpo de la petición no contiene JSON válido.",
    );
  }

  const result = generationRequestSchema.safeParse(body);

  if (!result.success) {
    return errorResponse(
      400,
      "INVALID_GENERATION_REQUEST",
      "La solicitud no cumple las reglas de generación.",
    );
  }

  const model = process.env.OLLAMA_MODEL?.trim();

    if (!model || model.includes(":cloud")) {
      return errorResponse(
        503,
        "GENERATION_NOT_CONFIGURED",
        "Configura un modelo local de Ollama en el servidor.",
      );
    }


  try {
    const generation = await generateFlashcards(result.data);

    return Response.json(generation, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return errorResponse(
      502,
      "GENERATION_FAILED",
      "No se ha podido obtener una generación válida. Revisa el contenido o inténtalo de nuevo más tarde.",
    );
  }
}
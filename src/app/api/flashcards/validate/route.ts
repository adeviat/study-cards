import { generationRequestSchema } from "../../../../features/flashcards/schemas/generation-contract";

export async function POST(request: Request): Promise<Response> {
  const contentType = request.headers
    .get("content-type")
    ?.split(";")[0]
    ?.trim()
    .toLowerCase();

  if (contentType !== "application/json") {
    return Response.json(
      {
        error: {
          code: "UNSUPPORTED_MEDIA_TYPE",
          message: "La petición debe utilizar application/json.",
        },
      },
      { status: 415 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        error: {
          code: "INVALID_JSON",
          message: "El cuerpo de la petición no contiene JSON válido.",
        },
      },
      { status: 400 },
    );
  }

  const result = generationRequestSchema.safeParse(body);

  if (!result.success) {
    return Response.json(
      {
        error: {
          code: "INVALID_GENERATION_REQUEST",
          message: "La solicitud no cumple las reglas de generación.",
          issues: result.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
      },
      { status: 400 },
    );
  }

  const { pages, cardCount } = result.data;

  const characterCount = pages.reduce(
    (total, page) => total + page.text.length,
    0,
  );

  return Response.json(
    {
      status: "validated",
      summary: {
        pageCount: pages.length,
        characterCount,
        requestedCardCount: cardCount,
      },
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
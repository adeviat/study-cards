import { afterEach, describe, expect, it, vi } from "vitest";

import type { GenerationRequest } from "../schemas/generation-contract";
import { validateGenerationOnServer } from "./validate-generation-on-server";

const request: GenerationRequest = {
  pages: [
    {
      pageNumber: 4,
      text: "Texto de ejemplo.",
    },
  ],
  cardCount: 3,
};

function createValidResponse() {
  return {
    status: "validated",
    summary: {
      pageCount: 1,
      characterCount: request.pages[0]!.text.length,
      requestedCardCount: 3,
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("validateGenerationOnServer", () => {
  it("envía la solicitud y devuelve el resumen validado", async () => {
    const body = createValidResponse();

    const fetchMock = vi.fn().mockResolvedValue(
      Response.json(body),
    );

    vi.stubGlobal("fetch", fetchMock);

    const result = await validateGenerationOnServer(request);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/flashcards/validate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
        cache: "no-store",
      },
    );

    expect(result).toEqual(body.summary);
  });

  it("comunica el mensaje de error del servidor", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json(
          {
            error: {
              code: "INVALID_GENERATION_REQUEST",
              message: "La solicitud no cumple las reglas de generación.",
            },
          },
          { status: 400 },
        ),
      ),
    );

    await expect(
      validateGenerationOnServer(request),
    ).rejects.toThrow(
      "La solicitud no cumple las reglas de generación.",
    );
  });

  it("controla los fallos de conexión", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );

    await expect(
      validateGenerationOnServer(request),
    ).rejects.toThrow(
      "No se ha podido conectar con el servidor.",
    );
  });

  it("rechaza una respuesta que no contiene JSON válido", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("<html>Error</html>", { status: 500 }),
      ),
    );

    await expect(
      validateGenerationOnServer(request),
    ).rejects.toThrow(
      "El servidor ha devuelto una respuesta que no es JSON válido.",
    );
  });

  it("rechaza un formato de respuesta inesperado", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({ ok: true }),
      ),
    );

    await expect(
      validateGenerationOnServer(request),
    ).rejects.toThrow(
      "La respuesta del servidor no tiene el formato esperado.",
    );
  });

  it("rechaza un resumen que no coincide con la solicitud", async () => {
    const body = createValidResponse();
    body.summary.requestedCardCount = 8;

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json(body)),
    );

    await expect(
      validateGenerationOnServer(request),
    ).rejects.toThrow(
      "El resumen del servidor no coincide con la solicitud enviada.",
    );
  });
});
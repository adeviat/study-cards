import { describe, expect, it } from "vitest";

import { POST } from "./route";

function createRequest(body: unknown): Request {
  return new Request(
    "http://localhost:3000/api/flashcards/validate",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
}

function createValidBody() {
  return {
    pages: [
      {
        pageNumber: 4,
        text: "Texto de ejemplo.",
      },
    ],
    cardCount: 3,
  };
}

describe("POST /api/flashcards/validate", () => {
  it("acepta una solicitud válida y devuelve su resumen", async () => {
    const response = await POST(
      createRequest(createValidBody()),
    );

    expect(response.status).toBe(200);

    expect(await response.json()).toEqual({
      status: "validated",
      summary: {
        pageCount: 1,
        characterCount: "Texto de ejemplo.".length,
        requestedCardCount: 3,
      },
    });

    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("rechaza un tipo de contenido distinto de JSON", async () => {
    const request = new Request(
      "http://localhost:3000/api/flashcards/validate",
      {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
        },
        body: "Texto sin formato.",
      },
    );

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(415);
    expect(body.error.code).toBe("UNSUPPORTED_MEDIA_TYPE");
  });

  it("rechaza un cuerpo con JSON mal formado", async () => {
    const request = new Request(
      "http://localhost:3000/api/flashcards/validate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: '{"pages":',
      },
    );

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("INVALID_JSON");
  });

  it("rechaza una cantidad de tarjetas fuera del límite", async () => {
    const response = await POST(
      createRequest({
        ...createValidBody(),
        cardCount: 11,
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("INVALID_GENERATION_REQUEST");

    expect(body.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "cardCount",
        }),
      ]),
    );
  });

  it("rechaza páginas sin texto aunque la petición evite el formulario", async () => {
    const response = await POST(
      createRequest({
        pages: [
          {
            pageNumber: 1,
            text: "   ",
          },
        ],
        cardCount: 3,
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("INVALID_GENERATION_REQUEST");
  });

  it("no devuelve el contenido del documento", async () => {
    const privateText = "Contenido privado utilizado para la prueba.";

    const response = await POST(
      createRequest({
        pages: [
          {
            pageNumber: 1,
            text: privateText,
          },
        ],
        cardCount: 2,
      }),
    );

    const responseText = await response.text();

    expect(response.status).toBe(200);
    expect(responseText).not.toContain(privateText);
  });
});
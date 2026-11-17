import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const { generateFlashcardsMock } = vi.hoisted(() => ({
  generateFlashcardsMock: vi.fn(),
}));

vi.mock(
  "../../../../features/flashcards/server/generate-flashcards.server",
  () => ({
    generateFlashcards: generateFlashcardsMock,
  }),
);

import { POST } from "./route";

function createValidBody() {
  return {
    pages: [
      {
        pageNumber: 4,
        text: "La memoria RAM almacena temporalmente datos.",
      },
    ],
    cardCount: 1,
  };
}

function createRequest(body: unknown): Request {
  return new Request(
    "http://localhost:3000/api/flashcards/generate",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
}

beforeEach(() => {
  generateFlashcardsMock.mockReset();

  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("AI_GENERATION_ENABLED", "true");
  vi.stubEnv("OLLAMA_MODEL", "qwen3:4b");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("POST /api/flashcards/generate", () => {
  it("rechaza la generación si está desactivada", async () => {
    vi.stubEnv("AI_GENERATION_ENABLED", "false");

    const response = await POST(createRequest(createValidBody()));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error.code).toBe("GENERATION_DISABLED");
    expect(generateFlashcardsMock).not.toHaveBeenCalled();
  });

  it("bloquea la generación en producción aunque la variable esté activa", async () => {
    vi.stubEnv("NODE_ENV", "production");

    const response = await POST(createRequest(createValidBody()));

    expect(response.status).toBe(503);
    expect(generateFlashcardsMock).not.toHaveBeenCalled();
  });

  it("rechaza un contenido que no sea JSON", async () => {
    const request = new Request(
      "http://localhost:3000/api/flashcards/generate",
      {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
        },
        body: "Texto.",
      },
    );

    const response = await POST(request);

    expect(response.status).toBe(415);
    expect(generateFlashcardsMock).not.toHaveBeenCalled();
  });

  it("rechaza JSON mal formado", async () => {
    const request = new Request(
      "http://localhost:3000/api/flashcards/generate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: '{"pages":',
      },
    );

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(generateFlashcardsMock).not.toHaveBeenCalled();
  });

  it("rechaza un cuerpo demasiado grande sin llamar al generador", async () => {
    const response = await POST(
      createRequest({
        extra: "a".repeat(128 * 1024),
      }),
    );

    expect(response.status).toBe(413);
    expect(generateFlashcardsMock).not.toHaveBeenCalled();
  });

  it("rechaza una solicitud que no cumple el contrato", async () => {
    const response = await POST(
      createRequest({
        ...createValidBody(),
        cardCount: 11,
      }),
    );

    expect(response.status).toBe(400);
    expect(generateFlashcardsMock).not.toHaveBeenCalled();
  });

  it("rechaza la generación si falta la configuración", async () => {
    vi.stubEnv("OLLAMA_MODEL", "");

    const response = await POST(createRequest(createValidBody()));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error.code).toBe("GENERATION_NOT_CONFIGURED");
    expect(generateFlashcardsMock).not.toHaveBeenCalled();
  });

  it("devuelve las tarjetas proporcionadas por el servicio", async () => {
    const generation = {
      cards: [
        {
          question: "¿Qué almacena temporalmente la RAM?",
          answer: "Datos.",
          sourcePage: 4,
          sourceExcerpt: "La memoria RAM almacena temporalmente datos.",
        },
      ],
    };

    generateFlashcardsMock.mockResolvedValue(generation);

    const response = await POST(createRequest(createValidBody()));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(generation);
    expect(generateFlashcardsMock).toHaveBeenCalledWith(
      createValidBody(),
    );
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("no expone detalles internos cuando falla el servicio", async () => {
    generateFlashcardsMock.mockRejectedValue(
      new Error("Detalle interno que no debe llegar al cliente"),
    );

    const response = await POST(createRequest(createValidBody()));
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.error.code).toBe("GENERATION_FAILED");
    expect(JSON.stringify(body)).not.toContain("Detalle interno");
  });

  it("rechaza un modelo cloud sin llamar al generador", async () => {
    vi.stubEnv("OLLAMA_MODEL", "example:cloud");

      const response = await POST(
        createRequest(createValidBody()),
      );

      const body = await response.json();

      expect(response.status).toBe(503);
      expect(body.error.code).toBe("GENERATION_NOT_CONFIGURED");
      expect(generateFlashcardsMock).not.toHaveBeenCalled();
  });

});
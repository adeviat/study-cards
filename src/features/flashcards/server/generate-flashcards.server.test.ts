import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  GenerationRequest,
  GenerationResponse,
} from "../schemas/generation-contract";

vi.mock("server-only", () => ({}));

import { generateFlashcards } from "./generate-flashcards.server";

const fetchMock = vi.fn<typeof fetch>();

const request: GenerationRequest = {
  pages: [
    {
      pageNumber: 4,
      text: "La memoria RAM almacena temporalmente datos e instrucciones.",
    },
  ],
  cardCount: 1,
};

function createGeneration(): GenerationResponse {
  return {
    cards: [
      {
        question: "¿Qué almacena temporalmente la memoria RAM?",
        answer: "datos e instrucciones.",
        sourcePage: 4,
        sourceExcerpt:
          "La memoria RAM almacena temporalmente datos e instrucciones.",
      },
    ],
  };
}

function createProviderResponse(
  content: string = JSON.stringify(createGeneration()),
  overrides: Record<string, unknown> = {},
): Response {
  return Response.json({
    done: true,
    done_reason: "stop",
    message: {
      role: "assistant",
      content,
    },
    ...overrides,
  });
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);

  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("AI_GENERATION_ENABLED", "true");
  vi.stubEnv("OLLAMA_MODEL", "qwen3:4b");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("generateFlashcards", () => {
  it("devuelve tarjetas cuando Ollama proporciona una generación válida", async () => {
    fetchMock.mockResolvedValue(createProviderResponse());

    const result = await generateFlashcards(request);

    expect(result).toEqual(createGeneration());
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("envía al servicio local el texto, el modelo y un esquema estructurado", async () => {
    fetchMock.mockResolvedValue(createProviderResponse());

    await generateFlashcards(request);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:11434/api/chat",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        redirect: "error",
        signal: expect.any(AbortSignal),
      }),
    );

    const options = fetchMock.mock.calls[0]?.[1];

    expect(typeof options?.body).toBe("string");

    if (typeof options?.body !== "string") {
      throw new Error("La petición de prueba no contiene un cuerpo JSON.");
    }

    const body = JSON.parse(options.body);

    expect(body).toMatchObject({
      model: "qwen3:4b",
      stream: false,
      think: false,
      format: {
        type: "object",
        properties: {
          cards: {
            type: "array",
          },
        },
      },
    });

    expect(body.messages).toEqual([
      {
        role: "system",
        content: expect.any(String),
      },
      {
        role: "user",
        content: expect.any(String),
      },
    ]);

    expect(JSON.parse(body.messages[1].content)).toEqual({
      requestedCardCount: 1,
      pages: request.pages,
    });
  });

  it("rechaza una solicitud inválida sin llamar a Ollama", async () => {
    await expect(
      generateFlashcards({
        ...request,
        cardCount: 0,
      }),
    ).rejects.toThrow("La solicitud de generación no es válida.");

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("no llama a Ollama cuando la generación está desactivada", async () => {
    vi.stubEnv("AI_GENERATION_ENABLED", "false");

    await expect(
      generateFlashcards(request),
    ).rejects.toThrow("La generación local está desactivada.");

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("bloquea la generación en producción", async () => {
    vi.stubEnv("NODE_ENV", "production");

    await expect(
      generateFlashcards(request),
    ).rejects.toThrow("La generación local está desactivada.");

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rechaza un modelo vacío sin llamar a Ollama", async () => {
    vi.stubEnv("OLLAMA_MODEL", "   ");

    await expect(
      generateFlashcards(request),
    ).rejects.toThrow(
      "La generación local no está configurada en el servidor.",
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rechaza un nombre de modelo cloud sin llamar a Ollama", async () => {
    vi.stubEnv("OLLAMA_MODEL", "example:cloud");

    await expect(
      generateFlashcards(request),
    ).rejects.toThrow(
      "Esta integración solo permite modelos locales.",
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rechaza un error HTTP sin exponer el cuerpo del proveedor", async () => {
    fetchMock.mockResolvedValue(
      new Response("Detalle interno del proveedor", {
        status: 500,
      }),
    );

    await expect(
      generateFlashcards(request),
    ).rejects.toThrow(
      "Ollama ha rechazado la solicitud: HTTP 500.",
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rechaza una respuesta que no ha terminado", async () => {
    fetchMock.mockResolvedValue(
      createProviderResponse(undefined, {
        done: false,
      }),
    );

    await expect(
      generateFlashcards(request),
    ).rejects.toThrow(
      "Ollama no ha devuelto una respuesta completa reconocible.",
    );
  });

  it("rechaza una respuesta sin mensaje del asistente", async () => {
    fetchMock.mockResolvedValue(
      Response.json({
        done: true,
        done_reason: "stop",
      }),
    );

    await expect(
      generateFlashcards(request),
    ).rejects.toThrow(
      "Ollama no ha devuelto una respuesta completa reconocible.",
    );
  });

  it("rechaza una generación que alcanzó el límite de salida", async () => {
    fetchMock.mockResolvedValue(
      createProviderResponse(undefined, {
        done_reason: "length",
      }),
    );

    await expect(
      generateFlashcards(request),
    ).rejects.toThrow(
      "La generación ha alcanzado el límite de salida.",
    );
  });

  it("rechaza un contenido de tarjetas que no sea JSON válido", async () => {
    fetchMock.mockResolvedValue(
      createProviderResponse('{"cards":'),
    );

    await expect(
      generateFlashcards(request),
    ).rejects.toThrow(
      "Ollama no ha devuelto un JSON válido de tarjetas.",
    );
  });

  it("rechaza un JSON de tarjetas que no cumple el contrato", async () => {
    fetchMock.mockResolvedValue(
      createProviderResponse(
        JSON.stringify({
          cards: [],
        }),
      ),
    );

    await expect(
      generateFlashcards(request),
    ).rejects.toThrow(
      "La respuesta no cumple el formato de tarjetas esperado.",
    );
  });

  it("rechaza una respuesta que no aparece en su cita", async () => {
    const generation = createGeneration();

    generation.cards[0]!.answer =
      "información guardada de forma permanente.";

    fetchMock.mockResolvedValue(
      createProviderResponse(JSON.stringify(generation)),
    );

    await expect(
      generateFlashcards(request),
    ).rejects.toThrow(
      "La respuesta de la tarjeta 1 no aparece literalmente en su fragmento de referencia.",
    );
  });

  it("propaga un fallo de conexión sin reintentar", async () => {
    const connectionError = new TypeError("fetch failed");

    fetchMock.mockRejectedValue(connectionError);

    await expect(
      generateFlashcards(request),
    ).rejects.toBe(connectionError);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("propaga un error de timeout sin reintentar", async () => {
    const timeoutError = new DOMException(
      "Tiempo de espera agotado.",
      "TimeoutError",
    );

    fetchMock.mockRejectedValue(timeoutError);

    await expect(
      generateFlashcards(request),
    ).rejects.toBe(timeoutError);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
import "server-only";

import { z } from "zod";

import { validateGenerationResponse } from "../lib/validate-generation-response";
import {
  generationRequestSchema,
  generationResponseSchema,
} from "../schemas/generation-contract";
import type {
  GenerationRequest,
  GenerationResponse,
} from "../schemas/generation-contract";

import {
  buildGenerationInput,
  GENERATION_INSTRUCTIONS,
} from "./build-generation-input";

const OLLAMA_CHAT_URL = "http://127.0.0.1:11434/api/chat";
const GENERATION_TIMEOUT_MS = 180_000;

const ollamaResponseSchema = z.object({
  done: z.literal(true),
  done_reason: z.string().optional(),
  message: z.object({
    role: z.literal("assistant"),
    content: z.string().min(1),
  }),
});

export async function generateFlashcards(
  input: GenerationRequest,
): Promise<GenerationResponse> {
  const requestResult = generationRequestSchema.safeParse(input);

  if (!requestResult.success) {
    throw new Error("La solicitud de generación no es válida.");
  }

  if (
    process.env.AI_GENERATION_ENABLED !== "true" ||
    process.env.NODE_ENV !== "development"
  ) {
    throw new Error("La generación local está desactivada.");
  }

  const model = process.env.OLLAMA_MODEL?.trim();

  if (!model) {
    throw new Error(
      "La generación local no está configurada en el servidor.",
    );
  }

  if (model.includes(":cloud")) {
    throw new Error(
      "Esta integración solo permite modelos locales.",
    );
  }

  const request = requestResult.data;

  const outputSchema = z.toJSONSchema(
    generationResponseSchema,
    { io: "input" },
  );

  const response = await fetch(OLLAMA_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(GENERATION_TIMEOUT_MS),
    body: JSON.stringify({
      model,
      stream: false,
      think: false,
      messages: [
        {
          role: "system",
          content: GENERATION_INSTRUCTIONS,
        },
        {
          role: "user",
          content: buildGenerationInput(request),
        },
      ],
      format: outputSchema,
      options: {
        temperature: 0,
        num_ctx: 16_384,
        num_predict: 6_000,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Ollama ha rechazado la solicitud: HTTP ${response.status}.`,
    );
  }

  const rawResponse: unknown = await response.json();
  const providerResult = ollamaResponseSchema.safeParse(rawResponse);

  if (!providerResult.success) {
    throw new Error(
      "Ollama no ha devuelto una respuesta completa reconocible.",
    );
  }

  if (providerResult.data.done_reason === "length") {
    throw new Error(
      "La generación ha alcanzado el límite de salida.",
    );
  }

  let generatedContent: unknown;

  try {
    generatedContent = JSON.parse(
      providerResult.data.message.content,
    );
  } catch {
    throw new Error(
      "Ollama no ha devuelto un JSON válido de tarjetas.",
    );
  }

  const validation = validateGenerationResponse(
    generatedContent,
    request,
  );

  if (!validation.success) {
    throw new Error(
      `No se puede aceptar la generación: ${validation.error}`,
    );
  }

  return validation.data;
}
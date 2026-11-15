import type { ExtractedPage } from "@/features/documents/types/extracted-document";

import { generationRequestSchema } from "../schemas/generation-contract";
import type { GenerationRequest } from "../schemas/generation-contract";

type BuildRequestResult =
  | {
      success: true;
      data: GenerationRequest;
    }
  | {
      success: false;
      error: string;
    };

export function buildGenerationRequest(
  pages: ExtractedPage[],
  cardCountValue: string,
): BuildRequestResult {
  const result = generationRequestSchema.safeParse({
    pages: pages
      .filter((page) => page.text.trim().length > 0)
      .map((page) => ({
        pageNumber: page.pageNumber,
        text: page.text,
      })),
    cardCount:
      cardCountValue.trim() === ""
        ? Number.NaN
        : Number(cardCountValue),
  });

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  const issue = result.error.issues[0];

  if (issue?.path[0] === "cardCount") {
    return {
      success: false,
      error: "Introduce una cantidad entera de tarjetas entre 1 y 10.",
    };
  }

  if (issue?.path[0] === "pages") {
    if (issue.code === "too_small") {
      return {
        success: false,
        error: "La selección no contiene páginas con texto extraíble.",
      };
    }

    if (issue.code === "too_big") {
      return {
        success: false,
        error:
          "La selección supera las 20 páginas con texto. Reduce el rango.",
      };
    }

    if (issue.code === "custom") {
      return {
        success: false,
        error: issue.message,
      };
    }
  }

  return {
    success: false,
    error: "No se puede preparar la solicitud con los datos seleccionados.",
  };
}
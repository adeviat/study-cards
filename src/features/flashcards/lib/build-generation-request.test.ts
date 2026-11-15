import { describe, expect, it } from "vitest";

import { GENERATION_LIMITS } from "../schemas/generation-contract";
import { buildGenerationRequest } from "./build-generation-request";

const pages = [
  { pageNumber: 4, text: "Contenido de estudio." },
];

describe("buildGenerationRequest", () => {
  it("convierte la cantidad y construye una solicitud válida", () => {
    const result = buildGenerationRequest(pages, "5");

    expect(result).toEqual({
      success: true,
      data: {
        pages,
        cardCount: 5,
      },
    });
  });

  it("excluye páginas vacías sin cambiar la numeración original", () => {
    const result = buildGenerationRequest(
      [
        { pageNumber: 4, text: "Primer contenido." },
        { pageNumber: 5, text: "   " },
        { pageNumber: 6, text: "Segundo contenido." },
      ],
      "2",
    );

    expect(result).toEqual({
      success: true,
      data: {
        pages: [
          { pageNumber: 4, text: "Primer contenido." },
          { pageNumber: 6, text: "Segundo contenido." },
        ],
        cardCount: 2,
      },
    });
  });

  it.each(["", " ", "0", "11", "1.5", "abc"])(
    "rechaza una cantidad inválida: %j",
    (value) => {
      const result = buildGenerationRequest(pages, value);

      expect(result).toEqual({
        success: false,
        error: "Introduce una cantidad entera de tarjetas entre 1 y 10.",
      });
    },
  );

  it("rechaza una selección sin texto", () => {
    const result = buildGenerationRequest(
      [{ pageNumber: 1, text: "   " }],
      "5",
    );

    expect(result).toEqual({
      success: false,
      error: "La selección no contiene páginas con texto extraíble.",
    });
  });

  it("rechaza demasiadas páginas con texto", () => {
    const manyPages = Array.from(
      { length: GENERATION_LIMITS.maxPages + 1 },
      (_, index) => ({
        pageNumber: index + 1,
        text: "Contenido.",
      }),
    );

    const result = buildGenerationRequest(manyPages, "5");

    expect(result).toEqual({
      success: false,
      error:
        "La selección supera las 20 páginas con texto. Reduce el rango.",
    });
  });

  it("rechaza contenido que supera el límite de caracteres", () => {
    const result = buildGenerationRequest(
      [
        {
          pageNumber: 1,
          text: "a".repeat(GENERATION_LIMITS.maxCharacters + 1),
        },
      ],
      "5",
    );

    expect(result).toEqual({
      success: false,
      error:
        "El contenido seleccionado supera el límite de 20.000 caracteres.",
    });
  });
});
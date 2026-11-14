import { describe, expect, it } from "vitest";

import { validatePageRange } from "./validate-page-range";

describe("validatePageRange", () => {
  const totalPages = 10;

  it("acepta un rango dentro del documento", () => {
    const result = validatePageRange(
      { from: 2, to: 5 },
      totalPages,
    );

    expect(result).toBeNull();
  });

  it("acepta seleccionar una sola página", () => {
    const result = validatePageRange(
      { from: 3, to: 3 },
      totalPages,
    );

    expect(result).toBeNull();
  });

  it("acepta seleccionar todo el documento", () => {
    const result = validatePageRange(
      { from: 1, to: totalPages },
      totalPages,
    );

    expect(result).toBeNull();
  });

  it("acepta un documento de una sola página", () => {
    const result = validatePageRange(
      { from: 1, to: 1 },
      1,
    );

    expect(result).toBeNull();
  });

  it.each([
    { from: 1.5, to: 5 },
    { from: 1, to: 5.5 },
    { from: Number.NaN, to: 5 },
    { from: 1, to: Number.NaN },
    { from: Number.POSITIVE_INFINITY, to: 5 },
    { from: 1, to: Number.POSITIVE_INFINITY },
  ])("rechaza valores no enteros: %j", (range) => {
    expect(validatePageRange(range, totalPages)).toBe(
      "Introduce números enteros en los dos campos.",
    );
  });

  it.each([
    { from: 0, to: 5 },
    { from: 1, to: 0 },
    { from: -1, to: 5 },
    { from: 1, to: -5 },
  ])("rechaza páginas menores que 1: %j", (range) => {
    expect(validatePageRange(range, totalPages)).toBe(
      "Las páginas deben ser iguales o mayores que 1.",
    );
  });

  it.each([
    { from: 11, to: 11 },
    { from: 1, to: 11 },
  ])("rechaza páginas que superan el total: %j", (range) => {
    expect(validatePageRange(range, totalPages)).toBe(
      "El documento solo tiene 10 páginas.",
    );
  });

  it("rechaza una página inicial mayor que la final", () => {
    const result = validatePageRange(
      { from: 8, to: 3 },
      totalPages,
    );

    expect(result).toBe(
      "La página inicial no puede ser mayor que la final.",
    );
  });
});
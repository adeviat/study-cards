export type PageRange = {
  from: number;
  to: number;
};

export function validatePageRange(
  range: PageRange,
  totalPages: number,
): string | null {
  if (
    !Number.isInteger(range.from) ||
    !Number.isInteger(range.to)
  ) {
    return "Introduce números enteros en los dos campos.";
  }

  if (range.from < 1 || range.to < 1) {
    return "Las páginas deben ser iguales o mayores que 1.";
  }

  if (range.from > totalPages || range.to > totalPages) {
    return `El documento solo tiene ${totalPages} páginas.`;
  }

  if (range.from > range.to) {
    return "La página inicial no puede ser mayor que la final.";
  }

  return null;
}
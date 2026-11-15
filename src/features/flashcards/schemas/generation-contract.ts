import { z } from "zod";

export const GENERATION_LIMITS = {
  maxPages: 20,
  maxCharacters: 20_000,
  maxCards: 10,
  maxQuestionCharacters: 500,
  maxAnswerCharacters: 2_000,
  maxExcerptCharacters: 1_000,
} as const;

const sourcePageSchema = z.strictObject({
  pageNumber: z.number().int().positive(),
  text: z.string().trim().min(1),
});

export const generationRequestSchema = z
  .strictObject({
    pages: z
      .array(sourcePageSchema)
      .min(1)
      .max(GENERATION_LIMITS.maxPages),

    cardCount: z
      .number()
      .int()
      .min(1)
      .max(GENERATION_LIMITS.maxCards),
  })
  .refine(
    ({ pages }) => {
      const totalCharacters = pages.reduce(
        (total, page) => total + page.text.length,
        0,
      );

      return totalCharacters <= GENERATION_LIMITS.maxCharacters;
    },
    {
      message:
        "El contenido seleccionado supera el límite de 20.000 caracteres.",
      path: ["pages"],
    },
  )
  .refine(
    ({ pages }) =>
      new Set(pages.map((page) => page.pageNumber)).size === pages.length,
    {
      message: "La solicitud contiene páginas repetidas.",
      path: ["pages"],
    },
  );

export const generatedCardSchema = z.strictObject({
  question: z
    .string()
    .trim()
    .min(1)
    .max(GENERATION_LIMITS.maxQuestionCharacters),

  answer: z
    .string()
    .trim()
    .min(1)
    .max(GENERATION_LIMITS.maxAnswerCharacters),

  sourcePage: z.number().int().positive(),

  sourceExcerpt: z
    .string()
    .trim()
    .min(1)
    .max(GENERATION_LIMITS.maxExcerptCharacters),
});

export const generationResponseSchema = z.strictObject({
  cards: z
    .array(generatedCardSchema)
    .min(1)
    .max(GENERATION_LIMITS.maxCards),
});

export type GenerationRequest = z.infer<
  typeof generationRequestSchema
>;

export type GeneratedCard = z.infer<typeof generatedCardSchema>;

export type GenerationResponse = z.infer<
  typeof generationResponseSchema
>;
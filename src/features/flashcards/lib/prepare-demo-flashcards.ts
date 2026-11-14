import type { ExtractedPage } from "@/features/documents/types/extracted-document";
import type { Flashcard } from "@/features/flashcards/types/flashcard";

export async function prepareDemoFlashcards(
  pages: ExtractedPage[],
): Promise<Flashcard[]> {
  const hasText = pages.some((page) => page.text.trim().length > 0);

  if (!hasText) {
    throw new Error(
      "El rango seleccionado no contiene texto extraíble. Selecciona otras páginas.",
    );
  }

  // Retraso artificial para comprobar el estado de carga.
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 600);
  });

  return [
    {
      id: "prepared-demo-001",
      question: "Ejemplo: ¿para qué sirve este modo de demostración?",
      answer:
        "Sirve para comprobar el recorrido de preparación y estudio de tarjetas. Esta pregunta no se ha generado a partir del PDF.",
    },
    {
      id: "prepared-demo-002",
      question: "Ejemplo: ¿qué contenido recibirá la generación real?",
      answer:
        "El contenido de las páginas que hayas seleccionado y confirmado. En esta demostración no se envía información a ningún servicio.",
    },
  ];
}
import { FlashcardItem } from "@/features/flashcards/components/flashcard-item";
import { demoFlashcards } from "@/features/flashcards/data/demo-flashcards";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900 sm:py-20">
      <div className="mx-auto w-full max-w-3xl">
        <header>
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-700">
            Study Cards
          </p>

          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-6xl">
            Tus apuntes, convertidos en tarjetas de estudio.
          </h1>

          <p className="mt-6 text-lg leading-8 text-slate-600">
            Estamos construyendo una herramienta para crear y revisar
            tarjetas a partir de tus documentos PDF.
          </p>
        </header>

        <section
          aria-labelledby="demo-title"
          className="mt-12"
        >
          <h2
            id="demo-title"
            className="text-xl font-semibold"
          >
            Prueba una tarjeta
          </h2>

          <p className="mt-2 leading-7 text-slate-600">
            Este ejemplo permite comprobar la interacción. Todavía no
            procesa documentos ni utiliza inteligencia artificial.
          </p>

          <ul className="mt-6 space-y-6">
            {demoFlashcards.map((card) => (
              <li key={card.id}>
                <FlashcardItem card={card} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
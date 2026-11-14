import { PdfSelector } from "@/features/documents/components/pdf-selector";


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
          aria-labelledby="document-title"
          className="mt-12"
        >
          <h2
            id="document-title"
            className="text-xl font-semibold"
          >
            Empieza por tu documento
          </h2>

          <p className="mt-2 leading-7 text-slate-600">
            Selecciona el PDF que quieres utilizar como material de estudio.
          </p>

          <div className="mt-6">
            <PdfSelector />
          </div>
        </section>

      </div>
    </main>
  );
}
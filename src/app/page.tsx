export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900 sm:py-20">
      <section
        aria-labelledby="home-title"
        className="mx-auto flex w-full max-w-3xl flex-col gap-6"
      >
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-700">
          Study Cards
        </p>

        <h1
          id="home-title"
          className="text-4xl font-bold tracking-tight sm:text-6xl"
        >
          Convierte tus apuntes en tarjetas de estudio.
        </h1>

        <p className="max-w-2xl text-lg leading-8 text-slate-600">
          Selecciona un PDF, revisa sus conceptos principales y estudia
          con tarjetas que podrás editar y organizar por temas.
        </p>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">
            Estamos preparando tu espacio de estudio
          </h2>

          <p className="mt-3 leading-7 text-slate-600">
            El siguiente paso será añadir la selección del documento
            y una vista de tarjetas de ejemplo.
          </p>
        </div>
      </section>
    </main>
  );
}
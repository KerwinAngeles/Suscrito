<template>
  <main class="mx-auto max-w-[680px] px-6 py-20">
    <div class="pill pill-accent mb-6">
      <span class="h-[7px] w-[7px] rounded-full bg-accent"></span>
      Falta configurar Supabase
    </div>

    <h1 class="text-[40px] leading-[1.1]">Casi listo</h1>
    <p class="text-muted mt-4 max-w-[58ch] text-pretty">
      Crea un proyecto en
      <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">supabase.com</a>,
      copia <code class="rounded bg-neutral-200 px-1.5 py-0.5 text-[13px]">.env.example</code> a
      <code class="rounded bg-neutral-200 px-1.5 py-0.5 text-[13px]">.env.local</code> y rellena las
      dos variables:
    </p>

    <pre
      class="card mt-6 overflow-x-auto p-5 text-[13px] leading-relaxed"
    ><code>VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key</code></pre>

    <div class="card mt-6 p-6">
      <h6 class="font-semibold">Después</h6>
      <ol class="text-muted mt-3 list-decimal space-y-2 pl-5 text-[14px]">
        <li>
          Abre el <strong class="text-ink">SQL Editor</strong> del proyecto y ejecuta
          <code class="rounded bg-neutral-200 px-1.5 py-0.5 text-[12.5px]">0001_init.sql</code> y
          <code class="rounded bg-neutral-200 px-1.5 py-0.5 text-[12.5px]">0002_demo_data.sql</code>.
        </li>
        <li>
          Reinicia <code class="rounded bg-neutral-200 px-1.5 py-0.5 text-[12.5px]">npm run dev</code>
          para que Vite lea las variables nuevas.
        </li>
      </ol>
    </div>
  </main>
</template>

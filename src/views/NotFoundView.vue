<template>
  <main class="mx-auto max-w-[560px] px-6 py-28 text-center">
    <h1 class="text-[48px] leading-[1.08]">
      Aquí no hay <span class="text-accent">nada</span>
    </h1>
    <p class="text-muted mx-auto mt-4 max-w-[40ch]">
      La página que buscabas no existe o ha cambiado de sitio.
    </p>
    <RouterLink :to="{ name: 'panel' }" class="btn btn-primary mt-6 inline-flex no-underline">
      Volver al panel
    </RouterLink>
  </main>
</template>

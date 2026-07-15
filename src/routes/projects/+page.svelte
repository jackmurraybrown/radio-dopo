<script>
  import BackgroundPattern from "$lib/components/BackgroundPattern.svelte";
  import DirectusImage from "$lib/components/DirectusImage.svelte";
  import { currentLanguage } from "$lib/stores/language.js";
  import { t } from "$lib/translations.js";

  // Get data from server-side load function
  let { data } = $props();

  const lang = $derived($currentLanguage);
</script>

<BackgroundPattern />

<div class="min-h-screen py-6">
  <div class="px-3 md:px-6">
    <header class="text-left mb-36">
      <h1 class="font-normal m-0 text-white uppercase tracking-[0.1em]">
        {t("page_projects", lang)}
      </h1>
    </header>
  </div>

  {#if data.projects.length === 0}
    <p class="text-white/60 py-8 px-3 md:px-6">No projects available yet.</p>
  {:else}
    <div class="flex flex-col border-t border-white">
      {#each data.projects as project (project.id)}
        <a
          href="/projects/{project.slug}"
          class="grid grid-cols-1 min-[480px]:grid-cols-2 gap-4 lg:gap-8 items-start border-b border-white no-underline text-white transition-opacity hover:opacity-80"
        >
          <div
            class="flex flex-col justify-center h-full p-3 pb-0 min-[480px]:px-6 min-[480px]:pb-0"
          >
            <h2 class="font-normal m-0 text-white underline">
              {project.title}
            </h2>
          </div>
          {#if project.image}
            <div class="w-full aspect-video overflow-hidden">
              <DirectusImage
                src={project.image}
                alt={project.title}
                class="w-full h-full object-cover block"
              />
            </div>
          {/if}
        </a>
      {/each}
    </div>
  {/if}
</div>

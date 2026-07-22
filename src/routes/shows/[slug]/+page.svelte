<script>
  import BackgroundPattern from "$lib/components/BackgroundPattern.svelte";
  import EpisodeRow from "$lib/components/EpisodeRow.svelte";
  import DirectusImage from "$lib/components/DirectusImage.svelte";
  import Markdown from "$lib/components/Markdown.svelte";
  import {
    currentLanguage,
    getTranslation,
    getDirectusLocale,
  } from "$lib/stores/language.js";

  /**
   * @typedef {import('$lib/types.js').Show} Show
   * @typedef {import('$lib/types.js').Episode} Episode
   */

  // Get data from server-side load function
  /** @type {{ data: { show: Show, episodes: Episode[] } }} */
  let { data } = $props();

  const lang = $derived($currentLanguage);

  // Helper to get translated description
  const description = $derived(
    getTranslation(data.show.translations, lang, "description")
  );
</script>

<BackgroundPattern />

<div class="min-h-screen py-6 px-6">
  <div
    class="grid grid-cols-[3fr_4fr_4fr] gap-8 items-start mb-12 md:mb-24 max-md:grid-cols-1 max-md:gap-4"
  >
    <div class="flex flex-col gap-2 justify-between h-full">
      <h1 class="font-normal m-0 text-left">
        {data.show.name}
      </h1>
      {#if data.show.frequency}
        <div class="flex gap-2 items-start">
          <span class="mt-1.5">→</span>
          <p class="font-normal m-0 whitespace-pre-line">
            {data.show.frequency.replace(/\s*\/\s*/g, "\n")}
          </p>
        </div>
      {/if}
      {#if data.show.genres?.length}
        <p class="font-normal m-0 text-white/70">
          {#each data.show.genres as genre, i (genre.id)}
            <span
              >{getTranslation(genre.translations, lang, "name")}</span
            >{#if i < data.show.genres.length - 1}<span class="mx-1.5"
                >/</span
              >{/if}
          {/each}
        </p>
      {/if}
    </div>
    {#if data.show.image}
      <div
        class="w-full flex-shrink-0 overflow-hidden max-md:h-auto max-md:aspect-square"
      >
        <DirectusImage
          src={data.show.image}
          alt={data.show.name}
          width="full"
          height="auto"
          class="w-full h-full object-cover block"
        />
      </div>
    {/if}
    {#if description}
      <Markdown content={description} />
    {/if}
  </div>

  <div class="grid grid-cols-[3fr_8fr] gap-8 max-md:grid-cols-1">
    <div>
      {#if data.show.links && data.show.links.length > 0}
        <ul class="list-none p-0 m-0 flex flex-col gap-2">
          {#each data.show.links as link}
            <li>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                class="text-white underline hover:opacity-70 transition-opacity"
              >
                {link.title || link.url}
              </a>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
    <div>
      <h2
        class="font-normal mb-2 text-white uppercase tracking-[0.1em] text-left"
      >
        Episodes
      </h2>
      {#if data.episodes.length === 0}
        <p class="text-white/60 py-8 text-left">No episodes available yet.</p>
      {:else}
        <div class="flex flex-col gap-8">
          {#each data.episodes as episode (episode.id)}
            <EpisodeRow {episode} />
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>

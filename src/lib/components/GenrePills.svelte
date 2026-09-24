<script>
  import { goto } from "$app/navigation";
  import { currentLanguage, getTranslation } from "$lib/stores/language.js";

  /**
   * @typedef {import('$lib/types.js').Genre} Genre
   */

  /**
   * @type {{ genres?: Genre[], onGenreClick?: (slug: string) => void, class?: string }}
   */
  let { genres = [], onGenreClick, class: className = "" } = $props();

  const lang = $derived($currentLanguage);

  const pill =
    "border border-white px-2 py-0.5 text-sm leading-tight uppercase text-white !no-underline";
  const interactive =
    "hover:bg-white hover:text-black hover:opacity-100 transition-colors cursor-pointer";
</script>

{#if genres?.length}
  <div class="flex flex-wrap gap-1.5 items-center min-w-0 max-w-full {className}">
    {#each genres as genre (genre.id)}
      {#if genre.slug}
        <button
          class="bg-transparent {pill} {interactive}"
          onclick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onGenreClick) onGenreClick(genre.slug);
            else goto(`/episodes?genre=${encodeURIComponent(genre.slug)}`);
          }}
        >
          {getTranslation(genre.translations, lang, "name")}
        </button>
      {:else}
        <span class={pill}>
          {getTranslation(genre.translations, lang, "name")}
        </span>
      {/if}
    {/each}
  </div>
{/if}

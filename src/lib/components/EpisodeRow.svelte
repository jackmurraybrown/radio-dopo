<script>
  import {
    playEpisode,
    togglePlayPause,
    audioPlayerStore,
  } from "$lib/stores/audioPlayer.js";
  import { formatDate } from "$lib/utils/dates.js";
  import { currentLanguage, getTranslation } from "$lib/stores/language.js";
  import { directusTransformer } from "$lib/unpicConfig.js";

  /**
   * @typedef {import('$lib/types.js').Episode} Episode
   */

  /** @type {{ episode: Episode, showDate?: boolean, showShowName?: boolean, onGenreClick?: (slug: string) => void }} */
  let { episode, showDate = true, showShowName = true, onGenreClick } = $props();

  const isCurrentEpisode = $derived(
    $audioPlayerStore.mode === "episode" &&
      $audioPlayerStore.currentEpisode?.id === episode.id,
  );

  const isPlaying = $derived(isCurrentEpisode && $audioPlayerStore.isPlaying);

  const lang = $derived($currentLanguage);

  let hovered = $state(false);
  let mouseX = $state(0);
  let mouseY = $state(0);

  const imageId = $derived(episode.image || episode.show?.image);
  const thumbnailUrl = $derived(
    imageId
      ? `${directusTransformer(imageId)}?width=400&quality=70&format=webp`
      : null,
  );

  /**
   * @param {MouseEvent} e
   */
  function handleMouseMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }

  /**
   * @param {MouseEvent} e
   */
  function handlePlay(e) {
    e.preventDefault();
    e.stopPropagation();
    if (isCurrentEpisode) {
      togglePlayPause();
    } else {
      playEpisode(episode);
    }
  }
</script>

{#snippet genreList()}
  {#if episode.genres?.length}
    {#each episode.genres as genre, i (genre.id)}
      {#if genre.slug}
        <button
          class="bg-transparent border-none p-0 italic text-white hover:text-pink transition-colors cursor-pointer !no-underline"
          onclick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onGenreClick?.(genre.slug);
          }}
        >
          {getTranslation(genre.translations, lang, "name")}
        </button>
      {:else}
        <span class="italic text-white">
          {getTranslation(genre.translations, lang, "name")}
        </span>
      {/if}{#if i < episode.genres.length - 1}<span
          class="text-white mx-1.5">/</span
        >{/if}
    {/each}
  {/if}
{/snippet}

<a
  href="/episodes/{episode.slug}"
  class="grid grid-cols-[minmax(0,1fr)_auto_auto] w-full min-w-0 gap-8 items-center py-8 border-b border-white/10 no-underline text-white transition-opacity last:border-b-0 hover:opacity-80 max-xl:flex max-xl:justify-between max-xl:gap-4 max-xl:py-6"
  onmouseenter={() => (hovered = true)}
  onmouseleave={() => (hovered = false)}
  onmousemove={handleMouseMove}
>
  <div class="flex items-center gap-3 max-xl:flex-1 max-xl:min-w-0">
    <button
      class="bg-transparent border-none text-white cursor-pointer flex items-center justify-center transition-transform duration-200 hover:scale-110 flex-shrink-0"
      onclick={handlePlay}
      aria-label={isPlaying ? "Pause {episode.title}" : "Play {episode.title}"}
    >
      {#if isPlaying}
        <img src="/images/pause.svg" alt="Pause" class="w-10 h-10" />
      {:else}
        <img src="/images/play.svg" alt="Play" class="w-10 h-10" />
      {/if}
    </button>
    <div class="flex flex-col xl:col-span-2 gap-0.5 max-xl:min-w-0 w-full">
      {#if episode.start}
        <p class="xl:hidden font-normal m-0 text-white/70 text-left">
          {formatDate(episode.start, "d, MMM yyyy", lang)}
        </p>
      {/if}
      {#if showShowName && episode.show}
        <h3
          class="font-normal m-0 text-white uppercase text-left max-xl:truncate"
        >
          {episode.show.name}
        </h3>
      {/if}
      <p
        class="font-normal m-0 text-white text-left max-xl:truncate"
        class:uppercase={!showShowName}
      >
        {episode.title}
      </p>
      {#if episode.genres?.length}
        <div class="xl:hidden flex flex-wrap min-w-0 max-w-full items-center text-left text-sm text-white/70">
          {@render genreList()}
        </div>
      {/if}
    </div>
  </div>
  <div class="flex flex-wrap items-center max-xl:hidden text-right justify-end whitespace-nowrap max-w-[300px]">
    {@render genreList()}
  </div>
  {#if episode.start}
    <p class="m-0 text-white text-right max-xl:hidden whitespace-nowrap">
      {formatDate(episode.start, "d, MMM yyyy", lang)}
    </p>
  {/if}
</a>

{#if thumbnailUrl && hovered}
  <div
    class="fixed pointer-events-none z-50 hidden xl:block"
    style="left: {mouseX + 16}px; top: {mouseY + 16}px;"
  >
    <img
      src={thumbnailUrl}
      alt={episode.title}
      width="200"
      height="200"
      class="w-[200px] h-auto"
    />
  </div>
{/if}

<script>
  import {
    playEpisode,
    togglePlayPause,
    audioPlayerStore,
  } from "$lib/stores/audioPlayer.js";
  import { formatDate } from "$lib/utils/dates.js";
  import { currentLanguage } from "$lib/stores/language.js";

  /**
   * @typedef {import('$lib/types.js').Episode} Episode
   */

  /** @type {{ episode: Episode, showDate?: boolean }} */
  let { episode, showDate = true } = $props();

  const isCurrentEpisode = $derived(
    $audioPlayerStore.mode === "episode" &&
      $audioPlayerStore.currentEpisode?.id === episode.id,
  );

  const isPlaying = $derived(isCurrentEpisode && $audioPlayerStore.isPlaying);

  const lang = $derived($currentLanguage);

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

<a
  href="/episodes/{episode.slug}"
  class="grid grid-cols-[3fr_auto_2fr] gap-8 items-center py-8 border-b border-white/10 no-underline text-white transition-opacity last:border-b-0 hover:opacity-80 max-md:flex max-md:justify-between max-md:gap-4 max-md:py-6"
>
  <div class="flex items-center gap-3 max-md:flex-1 max-md:min-w-0">
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
    <div class="flex flex-col md:col-span-2 gap-0.5 max-md:min-w-0 w-full">
      {#if episode.show}
        <h3
          class="font-normal m-0 text-white uppercase text-left max-md:truncate"
        >
          {episode.title}
        </h3>
      {/if}
      <p class="font-normal m-0 text-white text-left max-md:truncate">
        {episode.show.name}
      </p>
    </div>
  </div>
  <div class="w-[200px] flex-shrink-0 max-md:hidden"></div>
  {#if episode.start}
    <p class="m-0 text-white text-left max-md:text-right max-md:flex-shrink-0">
      {formatDate(episode.start, "d, MMM yyyy", lang)}
    </p>
  {/if}
</a>

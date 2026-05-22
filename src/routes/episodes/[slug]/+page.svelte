<script>
  import BackgroundPattern from "$lib/components/BackgroundPattern.svelte";
  import {
    playEpisode as playEpisodeAction,
    togglePlayPause,
    audioPlayerStore,
  } from "$lib/stores/audioPlayer.js";
  import DirectusImage from "$lib/components/DirectusImage.svelte";
  import Markdown from "$lib/components/Markdown.svelte";
  import { currentLanguage, getTranslation } from "$lib/stores/language.js";
  import { formatDate } from "$lib/utils/dates.js";

  /**
   * @typedef {import('$lib/types.js').Episode} Episode
   */

  // Get data from server-side load function
  /** @type {{ data: { episode: Episode } }} */
  let { data } = $props();

  const isCurrentEpisode = $derived(
    $audioPlayerStore.mode === "episode" &&
      $audioPlayerStore.currentEpisode?.id === data.episode.id
  );

  const isPlaying = $derived(isCurrentEpisode && $audioPlayerStore.isPlaying);

  const lang = $derived($currentLanguage);

  // Helper to get translated description
  const description = $derived(
    getTranslation(data.episode.translations, lang, "description")
  );

  function playEpisode() {
    if (isCurrentEpisode) {
      togglePlayPause();
    } else {
      playEpisodeAction(data.episode);
    }
  }
</script>

<BackgroundPattern />

<div class="min-h-screen py-6 px-6">
  <h1 class="font-normal text-white text-left">
    {data.episode.title}
  </h1>

  <h2 class="mb-12 h3 text-white font-normal text-left">
    {#if data.episode.show}
      <a
        href="/shows/{data.episode.show.slug}"
        class="h3 text-white underline transition-opacity hover:opacity-70"
      >
        {data.episode.show.name}
      </a>
    {/if}
    <span>{formatDate(data.episode.start, "d, MMM yyyy", lang)}</span>
  </h2>

  <button
    class="p-2 flex items-center justify-center transition-transform duration-200 hover:scale-110 flex-shrink-0 mb-12 no-underline"
    onclick={playEpisode}
    aria-label={isPlaying ? "Pause episode" : "Play episode"}
  >
    {#if isPlaying}
      <img src="/images/pause.svg" alt="Pause" class="w-[60px] h-[60px]" />
    {:else}
      <img src="/images/play.svg" alt="Play" class="w-[60px] h-[60px]" />
    {/if}
  </button>

  <div
    class="grid grid-cols-2 gap-8 items-start max-md:grid-cols-1 max-md:gap-6"
  >
    {#if data.episode.show?.image}
      <div class="w-full overflow-hidden">
        <DirectusImage
          src={data.episode.show.image}
          alt={data.episode.show.name}
          width={600}
          height={600}
          class="w-full h-auto object-cover block"
        />
      </div>
    {/if}
    {#if description}
      <div class="min-w-0">
        <Markdown
          content={description}
          class="leading-relaxed text-white/80 m-0 text-left"
        />
      </div>
    {/if}
  </div>

  {#if data.episode.type === "Pre-record" && data.episode.tracklist}
    <div class="mt-12">
      <h3 class="text-white mb-4">Tracklist</h3>
      <p class="text-white/80 whitespace-pre-line">{data.episode.tracklist}</p>
    </div>
  {/if}
</div>

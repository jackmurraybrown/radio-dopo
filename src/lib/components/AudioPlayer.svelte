<script>
  import { onMount } from "svelte";
  import {
    audioPlayerStore,
    backToLive,
    togglePlayPause,
    updateTime,
    seekTo,
  } from "$lib/stores/audioPlayer.js";
  import LanguageSwitcher from "$lib/components/LanguageSwitcher.svelte";
  import { formatDate } from "$lib/utils/dates.js";
  import { currentLanguage } from "$lib/stores/language.js";

  /**
   * @typedef {import('$lib/types.js').Episode} Episode
   */

  let audio = $state(/** @type {HTMLAudioElement | undefined} */ (undefined));
  let currentShow = $state(/** @type {{ title: string } | null} */ (null));
  let isOnAir = $state(false);
  let loading = $state(true);
  let currentSrc = $state(/** @type {string | null} */ (null));

  let { onStatusUpdate } = $props();

  const STREAM_URL = "https://streaming.radio.co/s807721f02/listen";
  const STATUS_API = "https://public.radio.co/stations/s807721f02/status";
  const SCHEDULE_API = "/api/schedule";

  // Handle source changes
  $effect(() => {
    if (!audio) return;

    const store = $audioPlayerStore;
    let newSrc = /** @type {string | null} */ (null);

    if (store.mode === "episode" && store.currentEpisode) {
      newSrc = store.currentEpisode.audio;
    } else if (store.mode === "live") {
      newSrc = STREAM_URL;
    }

    // Only update source if it changed
    if (newSrc && newSrc !== currentSrc) {
      currentSrc = newSrc;

      // Pause and change source
      audio.pause();
      audio.src = newSrc;
      audio.load();

      if (store.isPlaying) {
        const handleCanPlay = () => {
          audio?.play().catch(() => {});
        };
        audio?.addEventListener("canplay", handleCanPlay, {
          once: true,
        });
      }
    }
  });

  // Handle play/pause separately from source changes
  $effect(() => {
    if (!audio) return;

    const store = $audioPlayerStore;

    if (store.isPlaying && audio.paused) {
      // If in live mode and resuming playback, reload the stream to get current live moment
      if (store.mode === "live" && audio.readyState >= 2) {
        audio.load();
      }
      audio.play().catch(() => {});
    } else if (!store.isPlaying && !audio.paused) {
      audio.pause();
    }
  });

  async function fetchStatus() {
    try {
      // First, check if there's a live scheduled event
      const scheduleResponse = await fetch(SCHEDULE_API);
      const scheduleData = await scheduleResponse.json();

      if (scheduleData.liveNow) {
        // There's a scheduled show live now, use that info
        currentShow = {
          title: scheduleData.liveNow.playlist.title,
        };
        isOnAir = true;
        loading = false;
        onStatusUpdate?.(true);
        return;
      }

      // Otherwise, fall back to radio.co status
      const response = await fetch(STATUS_API);
      const data = await response.json();
      currentShow = data.current_track || null;
      isOnAir = data.status === "online";
      loading = false;
      onStatusUpdate?.(isOnAir);
    } catch (error) {
      loading = false;
      onStatusUpdate?.(false);
    }
  }

  function handlePlayPause() {
    togglePlayPause();
  }

  function handleBackToLive() {
    backToLive();
  }

  function handleTimeUpdate() {
    if (audio && $audioPlayerStore.mode === "episode") {
      updateTime(audio.currentTime, audio.duration);
    }
  }

  /**
   * @param {MouseEvent} e
   */
  function handleSeek(e) {
    if (!audio || $audioPlayerStore.mode !== "episode") return;
    const rect = /** @type {HTMLElement} */ (
      e.currentTarget
    ).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * audio.duration;

    // Update audio time first
    audio.currentTime = newTime;

    // Then update store (this will prevent the glitch)
    seekTo(newTime);
  }

  /**
   * @param {number} seconds
   */
  function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  export function togglePlay() {
    handlePlayPause();
  }

  onMount(() => {
    fetchStatus();
    // Check every 30 seconds for live status and schedule updates
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  });
</script>

<!-- Single audio element for both live and episodes -->
<audio
  bind:this={audio}
  preload="none"
  crossorigin="anonymous"
  ontimeupdate={handleTimeUpdate}
></audio>

<header
  class="flex items-center px-3 gap-4 h-20 md:border-0 border-b border-white bg-black"
>
  <button
    class="p-2 flex items-center justify-center transition-transform duration-200 hover:scale-110 flex-shrink-0 no-underline"
    onclick={handlePlayPause}
    aria-label={$audioPlayerStore.isPlaying ? "Pause" : "Play"}
  >
    {#if $audioPlayerStore.isPlaying}
      <img src="/images/pause.svg" alt="Pause" class="w-10 h-10" />
    {:else}
      <img src="/images/play.svg" alt="Play" class="w-10 h-10" />
    {/if}
  </button>

  <div class="flex-1 min-w-0 flex items-center">
    {#if $audioPlayerStore.mode === "episode" && $audioPlayerStore.isPlaying}
      <!-- Show timeline when playing episode -->
      <div class="flex items-center gap-2 w-full">
        <button
          class="flex-1 h-2 bg-transparent border-none rounded cursor-pointer p-0 overflow-visible relative no-underline"
          onclick={handleSeek}
          aria-label="Seek timeline"
        >
          <div
            class="absolute top-1/2 left-0 right-0 h-1 bg-white rounded-[1px] -translate-y-1/2"
          ></div>
          <div
            class="absolute top-1/2 left-0 h-2.5 bg-white rounded-sm transition-[width] duration-100 -translate-y-1/2"
            style="width: {($audioPlayerStore.currentTime /
              $audioPlayerStore.duration) *
              100}%"
          ></div>
        </button>
        <span class="text-xs text-white min-w-fit whitespace-nowrap"
          >{formatTime($audioPlayerStore.currentTime)} / {formatTime(
            $audioPlayerStore.duration
          )}</span
        >
      </div>
    {:else if $audioPlayerStore.mode === "episode" && $audioPlayerStore.currentEpisode}
      <!-- Show episode info when paused -->
      <div class="min-w-0 flex-1">
        {#if $audioPlayerStore.currentEpisode.title?.trim() && $audioPlayerStore.currentEpisode.show?.name && $audioPlayerStore.currentEpisode.title.trim() !== $audioPlayerStore.currentEpisode.show.name}
          <!-- Show both episode and show name if different -->
          <p class="truncate m-0 text-sm">
            {$audioPlayerStore.currentEpisode.title} • {$audioPlayerStore.currentEpisode.show.name}
            {#if $audioPlayerStore.currentEpisode.start}
              • {formatDate($audioPlayerStore.currentEpisode.start, "d MMM yyyy", $currentLanguage)}
            {/if}
          </p>
        {:else}
          <!-- Show only one name if they're the same or one is missing -->
          <p class="truncate m-0 text-sm">
            {$audioPlayerStore.currentEpisode.title?.trim() || $audioPlayerStore.currentEpisode.show?.name || "Episode"}
            {#if $audioPlayerStore.currentEpisode.start}
              • {formatDate($audioPlayerStore.currentEpisode.start, "d MMM yyyy", $currentLanguage)}
            {/if}
          </p>
        {/if}
      </div>
    {:else}
      <!-- Show title when in live mode -->
      <div class="min-w-0 flex-1">
        {#if loading}
          <p class="truncate m-0">Loading...</p>
        {:else if currentShow}
          <p class="truncate m-0">
            {currentShow?.title || "Live Now"}
          </p>
        {:else}
          <p class="truncate m-0">Off Air</p>
        {/if}
      </div>
    {/if}
  </div>

  <div class="flex items-center gap-3 flex-shrink-0">
    {#if $audioPlayerStore.mode === "episode"}
      {#if $audioPlayerStore.currentEpisode?.slug}
        <a
          href="/episodes/{$audioPlayerStore.currentEpisode.slug}"
          class="text-xs no-underline"
        >
          INFO
        </a>
      {/if}
      <button onclick={handleBackToLive} class="text-xs no-underline">
        BACK TO LIVE
      </button>
    {/if}

    <img
      src="/images/onAir.svg"
      alt="On Air"
      class="w-[30px] h-[30px] flex-shrink-0 transition-all duration-300 max-md:hidden {isOnAir &&
      $audioPlayerStore.mode === 'live'
        ? ''
        : 'outlined-svg-only'}"
    />
  </div>
</header>

<style>
  .outlined-svg-only {
    filter: brightness(0) invert(1) drop-shadow(0 0 0 white)
      drop-shadow(0 0 0 white);
  }
</style>

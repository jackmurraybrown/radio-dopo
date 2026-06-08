<script>
  import { onMount } from "svelte";
  import EpisodeRow from "$lib/components/EpisodeRow.svelte";
  import DirectusImage from "$lib/components/DirectusImage.svelte";
  import { currentLanguage } from "$lib/stores/language.js";
  import { t } from "$lib/translations.js";

  let { data } = $props();

  let imagePosition = $state({ x: 50, y: 50 });
  let showImage = $state(false);
  let searchMode = $state(false);
  let searchQuery = $state("");
  let searchResults = $state([]);
  let displayedEpisodes = $state(data.episodes);
  let isSearching = $state(false);
  let searchInput = $state();

  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let searchTimeout;

  onMount(() => {
    // Position images on left side or bottom right (not top right)
    const side = Math.random() > 0.5 ? 1 : 0;
    imagePosition = {
      x: side === 1 ? 85 + Math.random() * 15 : Math.random() * 15,
      y: side === 1 ? 67 + Math.random() * 10 : 30 + Math.random() * 45,
    };
    setTimeout(() => {
      showImage = true;
    }, 50);
  });

  function toggleSearch() {
    searchMode = !searchMode;
    if (searchMode) {
      setTimeout(() => searchInput?.focus(), 100);
    } else {
      searchQuery = "";
      searchResults = [];
      displayedEpisodes = data.episodes;
      isSearching = false;
      clearTimeout(searchTimeout);
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim()) {
      searchResults = [];
      displayedEpisodes = data.episodes;
      isSearching = false;
      return;
    }

    isSearching = true;
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/episodes?search=${encodeURIComponent(searchQuery)}&limit=10`,
        );
        const responseData = await response.json();
        searchResults = responseData.episodes || [];
        displayedEpisodes = searchResults;
      } catch (error) {
        console.error("Error searching:", error);
        searchResults = [];
        displayedEpisodes = [];
      } finally {
        isSearching = false;
      }
    }, 400);
  }
</script>

<div
  class="flex flex-col items-center justify-center p-8 min-h-full gap-16 max-md:p-0 max-md:gap-8 max-md:justify-start"
>
  <div
    class="hidden md:flex flex-col items-center justify-center relative w-[50vw] max-w-[800px]"
    style="min-height: 70vh;"
  >
    {#if data.randomImage}
      <DirectusImage
        src={data.randomImage}
        alt=""
        width={400}
        height={400}
        class="absolute w-[50%] max-w-[350px] h-auto z-0 pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-opacity duration-[800ms] ease-in {showImage
          ? 'opacity-100'
          : 'opacity-0'}"
        style="left: {imagePosition.x}%; top: {imagePosition.y}%;"
      />
    {/if}
    <img
      src="/images/logo.svg"
      alt="Radio Dopo"
      class="w-full max-w-[1600px] h-auto relative z-[1] md:mix-blend-difference"
    />
  </div>

  <div class="md:hidden flex flex-col items-center w-full p-0 m-0">
    {#if data.randomImage}
      <DirectusImage
        src={data.randomImage}
        alt=""
        width={600}
        height={600}
        class="w-screen max-w-full h-auto z-0 transition-opacity duration-[800ms] ease-in -mb-[60px] {showImage
          ? 'opacity-100'
          : 'opacity-0'}"
      />
    {/if}
    <img
      src="/images/logo.svg"
      alt="Radio Dopo"
      class="w-5/6 h-auto relative z-[1] mt-0 px-4"
    />
  </div>

  {#if data.episodes && data.episodes.length > 0}
    <div class="w-full max-w-screen-xl px-0 md:px-8 max-md:px-4">
      <div class="flex items-center justify-center gap-4 mb-8 h-[40px]">
        {#if searchMode}
          <div class="flex-1 max-w-2xl relative h-full">
            <input
              bind:this={searchInput}
              bind:value={searchQuery}
              oninput={handleSearch}
              type="text"
              placeholder="Search episodes and shows..."
              class="w-full h-full bg-transparent border-b border-white text-white px-2 pr-8 font-normal uppercase tracking-[0.1em] text-left focus:outline-none placeholder:text-white/50"
            />
            {#if isSearching}
              <div class="absolute right-2 top-1/2 -translate-y-1/2">
                <img
                  src="/images/onAir.svg"
                  alt="Searching"
                  class="w-5 h-5 animate-pulse brightness-0 invert"
                />
              </div>
            {/if}
          </div>
          <button
            onclick={toggleSearch}
            class="flex-shrink-0 text-white hover:opacity-70 transition-opacity"
            aria-label="Close search"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 5L5 15M5 5L15 15"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </button>
        {:else}
          <h2
            class="font-normal text-white uppercase tracking-[0.1em] text-center h-full flex items-center"
          >
            Recent Episodes
          </h2>
          <button
            onclick={toggleSearch}
            class="flex-shrink-0 text-white hover:opacity-70 transition-opacity"
            aria-label="Search episodes"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="8"
                cy="8"
                r="6"
                stroke="currentColor"
                stroke-width="2"
              />
              <path
                d="M12.5 12.5L17 17"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </button>
        {/if}
      </div>
      <div class="flex flex-col gap-8 max-w-3xl mx-auto">
        {#if displayedEpisodes.length > 0}
          {#each displayedEpisodes as episode (episode.id)}
            <EpisodeRow {episode} showDate={searchMode && searchQuery} />
          {/each}
        {:else if searchMode && searchQuery && !isSearching}
          <p class="text-center text-white/50 py-16">No results found</p>
        {/if}
      </div>
      {#if !searchMode || !searchQuery}
        <div class="flex justify-center mt-8">
          <a href="/episodes" class="underline">
            {t("view_archive", $currentLanguage)}
          </a>
        </div>
      {/if}
    </div>
  {/if}
</div>

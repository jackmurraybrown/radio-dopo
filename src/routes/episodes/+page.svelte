<script>
  import BackgroundPattern from "$lib/components/BackgroundPattern.svelte";
  import EpisodeRow from "$lib/components/EpisodeRow.svelte";
  import { currentLanguage, getTranslation } from "$lib/stores/language.js";
  import { t } from "$lib/translations.js";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";

  // Get data from server-side load function
  let { data } = $props();

  let searchQuery = $state($page.url.searchParams.get("search") || "");
  let activeGenre = $state($page.url.searchParams.get("genre") || "");
  let isLoading = $state(false);
  let isSearching = $state(false);
  let allEpisodes = $state(data.episodes);
  let hasMore = $state(data.hasMore);

  function buildParams() {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (activeGenre) params.set("genre", activeGenre);
    return params;
  }

  // Handle search
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let searchTimeout;
  function handleSearch() {
    isSearching = true;
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
      await goto(`/episodes?${buildParams().toString()}`, { keepFocus: true });
      isSearching = false;
    }, 400);
  }

  function filterByGenre(slug) {
    activeGenre = activeGenre === slug ? "" : slug;
    goto(`/episodes?${buildParams().toString()}`);
  }

  let loadMoreTrigger = $state(
    /** @type {HTMLDivElement | undefined} */ (undefined),
  );

  // Load more episodes
  async function loadMore() {
    if (isLoading || !hasMore) return;

    isLoading = true;
    try {
      const params = buildParams();
      params.set("offset", allEpisodes.length.toString());
      params.set("limit", "20");

      const response = await fetch(`/api/episodes?${params.toString()}`);
      const newData = await response.json();

      allEpisodes = [...allEpisodes, ...newData.episodes];
      hasMore = newData.hasMore;
    } finally {
      isLoading = false;
    }
  }

  // Watch for data changes
  $effect(() => {
    allEpisodes = data.episodes;
    hasMore = data.hasMore;
    activeGenre = data.activeGenre || "";
    isSearching = false;
  });

  // Set up intersection observer for infinite scroll
  $effect(() => {
    if (!loadMoreTrigger) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(loadMoreTrigger);

    return () => {
      observer.disconnect();
    };
  });
</script>

<BackgroundPattern />

<div class="min-h-screen p-4 md:p-6 max-w-5xl">
  <header class="text-left mb-12">
    <h1 class="font-normal m-0 text-white uppercase tracking-[0.1em]">
      {t("archive", $currentLanguage)}
    </h1>
  </header>

  <div class="mb-6 relative">
    <input
      type="text"
      bind:value={searchQuery}
      oninput={handleSearch}
      placeholder="Search"
      class="w-full md:max-w-3/12 pb-0"
    />
    {#if isSearching}
      <div
        class="absolute right-2 top-1/2 -translate-y-1/2 md:right-[calc(75%+0.5rem)]"
      >
        <img
          src="/images/onAir.svg"
          alt="Searching"
          class="w-5 h-5 animate-pulse brightness-0 invert"
        />
      </div>
    {/if}
  </div>

  {#if activeGenre}
    {@const genre = data.genres?.find((g) => g.slug === activeGenre)}
    <div class="flex items-center gap-2 mb-6">
      <span class="text-white/60">Filtering by</span>
      <span class="text-white"
        >{genre
          ? getTranslation(genre.translations, $currentLanguage, "name")
          : activeGenre}</span
      >
      <button
        class="!no-underline text-white/50 hover:text-white transition-colors cursor-pointer flex items-center"
        aria-label="Clear genre filter"
        onclick={() => filterByGenre(activeGenre)}
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </button>
    </div>
  {/if}

  <div class="flex flex-col gap-8 mt-8 max-md:px-4">
    {#if isSearching && allEpisodes.length === 0}
      <div class="flex justify-center items-center py-16">
        <img
          src="/images/onAir.svg"
          alt="Loading"
          class="w-8 h-8 animate-pulse brightness-0 invert"
        />
      </div>
    {:else if allEpisodes.length === 0}
      <div class="text-center py-16 px-8">
        <p class="text-white/60 mb-6">
          {searchQuery
            ? `No episodes found matching "${searchQuery}"`
            : "No episodes available"}
        </p>
        {#if searchQuery}
          <button onclick={() => (searchQuery = "")}> Clear search </button>
        {/if}
      </div>
    {:else}
      {#each allEpisodes as episode (episode.id)}
        <EpisodeRow {episode} showDate={false} onGenreClick={filterByGenre} />
      {/each}
      {#if hasMore}
        <div bind:this={loadMoreTrigger} class="flex justify-center mt-8 py-4">
          {#if isLoading}
            <img
              src="/images/onAir.svg"
              alt="Loading"
              class="w-8 h-8 animate-pulse brightness-0 invert"
            />
          {/if}
        </div>
      {/if}
    {/if}
  </div>
</div>

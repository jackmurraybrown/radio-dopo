<script>
  import BackgroundPattern from "$lib/components/BackgroundPattern.svelte";
  import DirectusImage from "$lib/components/DirectusImage.svelte";
  import Markdown from "$lib/components/Markdown.svelte";
  import { currentLanguage, getTranslation } from "$lib/stores/language.js";
  import { t } from "$lib/translations.js";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";

  /**
   * @typedef {import('$lib/types.js').Show} Show
   */

  // Get data from server-side load function
  /** @type {{ data: { shows: Show[], hasMore: boolean } }} */
  let { data } = $props();

  let searchQuery = $state($page.url.searchParams.get("search") || "");
  let isLoading = $state(false);
  let isSearching = $state(false);
  let allShows = $state(data.shows);
  let hasMore = $state(data.hasMore);

  const lang = $derived($currentLanguage);

  // Helper to get translated description - now reactive to lang changes
  /**
   * @param {Show} show
   * @param {string} language
   */
  function getDescription(show, language) {
    const description = getTranslation(
      show.translations,
      language,
      "description"
    );
    if (!description) return "";
    // Truncate to 100 characters
    if (description.length > 100) {
      return description.slice(0, 100) + "...";
    }
    return description;
  }

  // Handle search
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let searchTimeout;
  function handleSearch() {
    isSearching = true;
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
      const params = new URLSearchParams();
      if (searchQuery) {
        params.set("search", searchQuery);
      }
      await goto(`/shows?${params.toString()}`, { keepFocus: true });
      isSearching = false;
    }, 400);
  }

  let loadMoreTrigger = $state(/** @type {HTMLDivElement | undefined} */ (undefined));

  // Load more shows
  async function loadMore() {
    if (isLoading || !hasMore) return;

    isLoading = true;
    try {
      const params = new URLSearchParams($page.url.searchParams);
      params.set("offset", allShows.length.toString());
      params.set("limit", "20");

      const response = await fetch(`/api/shows?${params.toString()}`);
      const newData = await response.json();

      allShows = [...allShows, ...newData.shows];
      hasMore = newData.hasMore;
    } finally {
      isLoading = false;
    }
  }

  // Watch for data changes
  $effect(() => {
    allShows = data.shows;
    hasMore = data.hasMore;
    isLoading = false;
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
      { threshold: 0.1 }
    );

    observer.observe(loadMoreTrigger);

    return () => {
      observer.disconnect();
    };
  });
</script>

<BackgroundPattern />

<div class="min-h-screen py-6">
  <div class="px-3 md:px-6">
    <header class="text-left mb-12">
      <h1 class="font-normal m-0 text-white uppercase tracking-[0.1em]">
        {t("page_shows", lang)}
      </h1>
    </header>

    <div class="mb-12 relative">
      <input
        type="text"
        bind:value={searchQuery}
        oninput={handleSearch}
        placeholder="Search"
        class="w-full md:max-w-3/12 pb-0"
      />
      {#if isSearching}
        <div class="absolute right-2 top-1/2 -translate-y-1/2 md:right-[calc(75%+0.5rem)]">
          <img
            src="/images/onAir.svg"
            alt="Searching"
            class="w-5 h-5 animate-pulse brightness-0 invert"
          />
        </div>
      {/if}
    </div>
  </div>

  <div class="flex flex-col border-t border-white">
    {#if isSearching && allShows.length === 0}
      <div class="flex justify-center items-center py-16">
        <img
          src="/images/onAir.svg"
          alt="Loading"
          class="w-8 h-8 animate-pulse brightness-0 invert"
        />
      </div>
    {:else if isLoading && allShows.length === 0}
      <div class="flex justify-center items-center py-16">
        <img
          src="/images/onAir.svg"
          alt="Loading"
          class="w-8 h-8 animate-pulse brightness-0 invert"
        />
      </div>
    {:else if allShows.length === 0}
      <div class="text-center py-16 px-8">
        <p class="text-white/60 mb-6">
          {searchQuery
            ? `No shows found matching "${searchQuery}"`
            : "No shows available"}
        </p>
        {#if searchQuery}
          <button onclick={() => (searchQuery = "")}> Clear search </button>
        {/if}
      </div>
    {:else}
      {#each allShows as show (show.id)}
        {@const description = getDescription(show, lang)}
        <a
          href="/shows/{show.slug}"
          class="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-[3fr_4fr_4fr] gap-4 lg:gap-8 items-start border-b border-white no-underline text-white transition-opacity hover:opacity-80"
        >
          <div
            class="flex flex-col gap-2 justify-between h-full p-3 pb-0 min-[480px]:px-6 min-[480px]:pb-0"
          >
            <h2 class="font-normal m-0 text-white underline">
              {show.name}
            </h2>
            {#if show.frequency}
              <div class="flex gap-2 items-start">
                <span class="mt-1.5">→</span>
                <p class="font-normal m-0 whitespace-pre-line">
                  {show.frequency.replace(/\s*\/\s*/g, "\n")}
                </p>
              </div>
            {/if}
            {#if show.genres?.length}
              <p class="font-normal m-0 text-white/70">
                {#each show.genres as genre, i (genre.id)}
                  <span
                    >{getTranslation(
                      genre.translations,
                      lang,
                      "name",
                    )}</span
                  >{#if i < show.genres.length - 1}<span class="mx-1.5"
                      >/</span
                    >{/if}
                {/each}
              </p>
            {/if}
          </div>
          {#if show.image}
            <div class="w-full aspect-square overflow-hidden">
              <DirectusImage
                src={show.image}
                alt={show.name}
                class="w-full h-full object-cover block"
              />
            </div>
          {/if}
          {#if description}
            <div class="lg:block hidden">
              <Markdown content={description} />
            </div>
          {/if}
        </a>
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

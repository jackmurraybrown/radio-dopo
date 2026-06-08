<script>
  import "../app.css";
  import AudioPlayer from "$lib/components/AudioPlayer.svelte";
  import ScheduleModal from "$lib/components/ScheduleModal.svelte";
  import MenuModal from "$lib/components/MenuModal.svelte";
  import BackgroundPattern from "$lib/components/BackgroundPattern.svelte";
  import LanguageSwitcher from "$lib/components/LanguageSwitcher.svelte";
  import { currentLanguage } from "$lib/stores/language.js";
  import { t } from "$lib/translations.js";
  import { audioPlayerStore } from "$lib/stores/audioPlayer.js";
  import { page } from "$app/stores";

  let { children, data } = $props();

  let scheduleModal = $state();
  let menuModal = $state();
  let isOnAir = $state(false);

  // Default site description
  const defaultDescription =
    "Established in 2024, Radio Dopo is a Palermo-based community radio station, working with artists, cultural workers and non-profit organizations, borne from a partnership with like-minded community radio stations Kiosk Radio in Brussels and Refuge Worldwide in Berlin.";

  // Get base page title and description from page data or defaults
  const pageTitle = $derived($page.data?.title || "Radio Dopo");
  const pageDescription = $derived(
    $page.data?.description || defaultDescription
  );
  const pageImage = $derived($page.data?.image || "/images/og-image.jpg");

  // Update HTML lang attribute when language changes
  $effect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = $currentLanguage;
    }
  });

  // Update Media Session API metadata
  $effect(() => {
    if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
      const store = $audioPlayerStore;

      if (store.mode === "episode" && store.currentEpisode) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: store.currentEpisode.title,
          artist: store.currentEpisode.show?.name || "Radio Dopo",
          album: "Radio Dopo Podcast",
          artwork: [
            {
              src: store.currentEpisode.show?.image || "/images/logo.svg",
              sizes: "512x512",
              type: "image/jpeg",
            },
          ],
        });
      } else if (store.mode === "live") {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: "Live Radio",
          artist: "Radio Dopo",
          album: "Live Broadcast",
          artwork: [
            {
              src: "/images/logo.svg",
              sizes: "512x512",
              type: "image/svg+xml",
            },
          ],
        });
      }
    }
  });

  function openSchedule() {
    scheduleModal?.openModal();
  }

  function openMenu() {
    menuModal?.open();
  }

  /**
   * @param {boolean} onAirStatus
   */
  function handleStatusUpdate(onAirStatus) {
    isOnAir = onAirStatus;
  }
</script>

<svelte:head>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
  <link rel="shortcut icon" href="/favicon.ico" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
  <link rel="manifest" href="/site.webmanifest" />
  <meta name="theme-color" content="#000000" />
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />
  <meta property="og:title" content={pageTitle} />
  <meta property="og:description" content={pageDescription} />
  <meta property="og:type" content="website" />
  <meta property="og:image" content={pageImage} />
  <meta property="og:url" content="https://radiodopo.it" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={pageTitle} />
  <meta name="twitter:description" content={pageDescription} />
  <meta name="twitter:image" content={pageImage} />
  <html lang={$currentLanguage}></html>
</svelte:head>
<div
  class="min-h-screen w-full bg-black pt-20 md:pt-20 overflow-x-hidden mobile-padding"
>
  <div class="fixed top-0 left-0 right-0 z-[100] bg-black">
    <div
      class="mobile-top-bar md:hidden flex items-center justify-between px-4 h-16 border-b border-white"
    >
      <div class="flex items-center gap-4">
        <button
          class="menu-button no-underline"
          onclick={openMenu}
          aria-label="Open menu"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <img src="/images/logo.svg" alt="Radio Dopo" class="h-10" />
      </div>
      <div class="flex items-center gap-3">
        <img
          src="/images/onAir.svg"
          alt="On Air"
          class="on-air-mobile w-6 h-6 cursor-pointer"
          class:active={isOnAir}
          onclick={openSchedule}
        />
        <LanguageSwitcher />
      </div>
    </div>

    <!-- Single AudioPlayer with responsive layout -->
    <div class="audio-player-container">
      <AudioPlayer onStatusUpdate={handleStatusUpdate} />
      <!-- Language switcher only visible on desktop, next to audio player -->
      <div class="hidden md:flex px-3 items-center">
        <LanguageSwitcher />
      </div>
    </div>
  </div>

  <div
    class="grid grid-cols-[80px_1fr_80px] min-h-[calc(100vh-80px)] max-md:grid-cols-1"
  >
    <button
      class="sidebar sidebar-left no-underline"
      onclick={openMenu}
      aria-label="Open menu"
    >
      <p class="sidebar-text heading m-0">{t("menu", $currentLanguage)}</p>
    </button>

    <main class="main-content">
      {@render children?.()}
    </main>

    <button
      class="sidebar sidebar-right no-underline"
      onclick={openSchedule}
      aria-label="Open schedule"
    >
      <p class="sidebar-text heading">{t("schedule", $currentLanguage)}</p>
    </button>
  </div>
</div>

<BackgroundPattern />
<ScheduleModal bind:this={scheduleModal} />
<MenuModal bind:this={menuModal} />

<style>
  @font-face {
    font-family: "Neue Vektor";
    src:
      url("/fonts/NeueVektorCNCRegular.woff2") format("woff2"),
      url("/fonts/NeueVektorCNCRegular.woff") format("woff");
    font-weight: normal;
    font-style: normal;
    font-display: swap;
  }

  :global(body) {
    margin: 0;
    padding: 0;
    background: #000;
    color: #fff;
    font-family:
      "Neue Vektor",
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      Roboto,
      "Helvetica Neue",
      Arial,
      sans-serif;
    overflow-x: hidden;
  }

  .audio-player-container {
    display: grid;
    grid-template-columns: 1fr;
    border-bottom: 1px solid white;
    background: black;
  }

  @media (min-width: 768px) {
    .audio-player-container {
      grid-template-columns: 1fr auto;
      align-items: center;
    }
  }

  .sidebar {
    background: #000;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    position: fixed;
    top: 80px;
    bottom: 0;
    width: 80px;
    padding-top: 2rem;
  }

  .sidebar-left {
    left: 0;
    border-right: 1px solid white;
    cursor: pointer;
    transition: background 0.3s;
  }

  .sidebar-left:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  .sidebar-right {
    right: 0;
    border-left: 1px solid white;
    cursor: pointer;
    transition: background 0.3s;
  }

  .sidebar-right:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  .sidebar-text {
    writing-mode: vertical-rl;
    text-orientation: mixed;
  }

  .sidebar-lang-switcher {
    position: absolute;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%) rotate(-90deg);
    transform-origin: center;
  }

  @media (max-width: 768px) {
    .sidebar {
      display: none;
    }
  }

  .main-content {
    background: radial-gradient(
        circle at 20% 30%,
        rgba(0, 100, 150, 0.05) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 70%,
        rgba(0, 100, 150, 0.05) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 50% 50%,
        rgba(0, 100, 150, 0.03) 0%,
        transparent 70%
      );
  }

  @media (min-width: 769px) {
    .main-content {
      grid-column: 2;
    }
  }

  .mobile-top-bar {
    background: #000;
  }

  .on-air-mobile {
    filter: grayscale(100%) brightness(0.5);
    transition: filter 0.3s;
  }

  .on-air-mobile.active {
    filter: none;
  }

  .on-air-desktop {
    filter: grayscale(100%) brightness(0.5);
    transition: filter 0.3s;
  }

  .on-air-desktop.active {
    filter: none;
  }

  .menu-button {
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 0.2s;
  }

  .menu-button:hover {
    opacity: 0.7;
  }

  @media (max-width: 768px) {
    .mobile-padding {
      padding-top: 144px !important;
    }
  }
</style>

<script>
  import { createDialog } from "@melt-ui/svelte";
  import { fly } from "svelte/transition";
  import { currentLanguage } from "$lib/stores/language.js";
  import { t } from "$lib/translations.js";

  const {
    elements: { overlay, content, close: closeButton, portalled },
    states: { open: isOpen },
  } = createDialog();

  export function openModal() {
    isOpen.set(true);
  }

  export function closeModal() {
    isOpen.set(false);
  }

  // Keep the old function names for backward compatibility
  export function open() {
    openModal();
  }

  export function close() {
    closeModal();
  }
</script>

<div use:portalled>
  {#if $isOpen}
    <div
      use:overlay
      class="fixed inset-0 bg-black/80 z-[10000]"
      transition:fly={{ duration: 500, x: 0, opacity: 0 }}
    />
    <div
      class="fixed left-0 top-0 bottom-0 bg-pink border-r border-white w-full max-w-[400px] md:max-w-[400px] max-md:max-w-full max-md:border-r-0 px-8 overflow-y-auto z-[10001]"
      use:content
      transition:fly={{ duration: 500, x: -400 }}
    >
      <button
        class="absolute top-6 right-6 bg-transparent no-underline border-none text-black text-3xl cursor-pointer p-2 leading-none transition-transform duration-200 hover:scale-110"
        use:closeButton>✕</button
      >
      <nav class="mt-8">
        <ul class="list-none p-0 m-0 space-y-2">
          <li>
            <a
              href="/"
              onclick={closeModal}
              class="heading font-normal text-black no-underline inline-block transition-all duration-200 hover:underline"
              >{t("nav_home", $currentLanguage).toUpperCase()}</a
            >
          </li>
          <li>
            <a
              href="/shows"
              onclick={closeModal}
              class="heading font-normal text-black no-underline inline-block transition-all duration-200 hover:underline"
              >{t("nav_shows", $currentLanguage).toUpperCase()}</a
            >
          </li>
          <li class="md:hidden">
            <a
              href="/schedule"
              onclick={closeModal}
              class="heading font-normal text-black no-underline inline-block transition-all duration-200 hover:underline"
              >{t("nav_schedule", $currentLanguage).toUpperCase()}</a
            >
          </li>
          <li>
            <a
              href="/episodes"
              onclick={closeModal}
              class="heading font-normal text-black no-underline inline-block transition-all duration-200 hover:underline"
              >{t("nav_episodes", $currentLanguage).toUpperCase()}</a
            >
          </li>
          <li>
            <a
              href="/about"
              onclick={closeModal}
              class="heading font-normal text-black no-underline inline-block transition-all duration-200 hover:underline"
              >{t("nav_about", $currentLanguage).toUpperCase()}</a
            >
          </li>
          <li>
            <a
              href="/partners"
              onclick={closeModal}
              class="heading font-normal text-black no-underline inline-block transition-all duration-200 hover:underline"
              >{t("nav_partners", $currentLanguage).toUpperCase()}</a
            >
          </li>
          <li>
            <a
              href="/projects"
              onclick={closeModal}
              class="heading font-normal text-black no-underline inline-block transition-all duration-200 hover:underline"
              >{t("nav_projects", $currentLanguage).toUpperCase()}</a
            >
          </li>
        </ul>
      </nav>
    </div>
  {/if}
</div>

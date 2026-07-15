<script>
  import BackgroundPattern from "$lib/components/BackgroundPattern.svelte";
  import DirectusImage from "$lib/components/DirectusImage.svelte";
  import Markdown from "$lib/components/Markdown.svelte";
  import { currentLanguage, getTranslation } from "$lib/stores/language.js";

  // Get data from server-side load function
  let { data } = $props();

  const lang = $derived($currentLanguage);

  const content = $derived(
    getTranslation(data.project.translations, lang, "content")
  );
</script>

<BackgroundPattern />

<div class="min-h-screen py-6 px-6">
  <h1 class="font-normal mb-8 text-white uppercase tracking-[0.1em] text-left">
    {data.project.title}
  </h1>

  {#if data.project.image}
    <div class="w-full mb-8">
      <DirectusImage
        src={data.project.image}
        alt={data.project.title}
        layout="fullWidth"
        class="w-full h-auto block"
      />
    </div>
  {/if}

  {#if content}
    <Markdown {content} class="text-white max-w-[65ch]" />
  {/if}
</div>

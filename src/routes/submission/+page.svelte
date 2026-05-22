<script>
  import { enhance } from "$app/forms";
  import { format } from "date-fns";
  import { marked } from "marked";

  export let data;
  export let form;

  let submitting = false;
  let success = false;
  let isDragging = false;
  let isAudioDragging = false;
  let infoRead = false;
  let currentStep = 1;

  // Description state (at least one required)
  let descriptionEn = form?.description_en ?? "";
  let descriptionIt = form?.description_it ?? "";
  $: if (enTranslation?.description && !descriptionEn) descriptionEn = enTranslation.description;
  $: if (itTranslation?.description && !descriptionIt) descriptionIt = itTranslation.description;
  $: hasDescription = descriptionEn.trim() !== "" || descriptionIt.trim() !== "";

  // Image state
  let imagePreview = "";
  let imageName = "";
  let imageId = null;
  let imageUploading = false;
  let imageError = "";

  // Audio state
  let audioName = "";
  let audioSize = 0;
  let audioId = null;
  let audioUploading = false;
  let audioError = "";

  const AUDIO_MAX_BYTES = 350 * 1024 * 1024;

  $: episode = data.episode;
  $: submissionForm = data.submissionForm;
  $: formContent = submissionForm?.content
    ? marked(submissionForm.content)
    : "";
  $: resources = (submissionForm?.resources || [])
    .map((r) => r.directus_files_id)
    .filter(Boolean);
  $: isPreRecord = episode?.type === "Pre-record";
  $: episodeDate = episode?.start
    ? format(new Date(episode.start), "MMMM d, yyyy")
    : "";

  $: enTranslation =
    episode?.translations?.find((t) => t.languages_code === "en-US") || {};
  $: itTranslation =
    episode?.translations?.find((t) => t.languages_code === "it-IT") || {};

  async function uploadFile(file, type) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "x-file-type": type },
      body: fd,
    });
    if (!res.ok) throw new Error((await res.text()) || "Upload failed");
    return (await res.json()).id;
  }

  async function handleImageFile(file) {
    imageError = "";
    imageUploading = true;
    imageId = null;
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview = e.target.result;
    };
    reader.readAsDataURL(file);
    imageName = file.name;
    try {
      imageId = await uploadFile(file, "image");
    } catch (err) {
      imageError = err.message || "Image upload failed. Please try again.";
      imagePreview = "";
      imageName = "";
    } finally {
      imageUploading = false;
    }
  }

  async function handleAudioFile(file) {
    audioError = "";
    if (file.size > AUDIO_MAX_BYTES) {
      audioError = "File is too large. Please upload an MP3 (max 350MB).";
      return;
    }
    audioUploading = true;
    audioId = null;
    audioName = file.name;
    audioSize = file.size;
    try {
      audioId = await uploadFile(file, "audio");
    } catch (err) {
      audioError = err.message || "Audio upload failed. Please try again.";
      audioName = "";
      audioSize = 0;
    } finally {
      audioUploading = false;
    }
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
  }

  function handleImageDrop(e) {
    e.preventDefault();
    isDragging = false;
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) handleImageFile(file);
  }

  function handleAudioChange(e) {
    const file = e.target.files?.[0];
    if (file) handleAudioFile(file);
  }

  function handleAudioDrop(e) {
    e.preventDefault();
    isAudioDragging = false;
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("audio/")) handleAudioFile(file);
  }
</script>

<svelte:head>
  <title>Show Submission Form - Radio Dopo</title>
</svelte:head>

<div class="min-h-screen p-4 md:p-8">
  <div class="max-w-3xl mx-auto">
    <h1 class="mb-8 text-pink">Show Submission Form</h1>

    {#if !episode}
      <div class="flex items-center justify-center min-h-[40vh]">
        <p class="text-center text-xl">
          Sorry, episode not found. Please contact Radio Dopo for assistance.
        </p>
      </div>
    {:else}
      <div class="mb-8 p-6 bg-pink/10 border-2 border-pink rounded">
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0">
            <svg
              class="w-8 h-8 text-pink"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div class="flex-1">
            <h2 class="text-pink text-2xl mb-2 uppercase letter-spacing-wide">
              Submitting for {episode.show_id?.name || "Your Show"}
            </h2>
            <p class="text-xl">
              <strong>Episode Date:</strong>
              {episodeDate},{" "}
              {#if episode.start}
                {format(new Date(episode.start), "HH:mm")} - {episode.end
                  ? format(new Date(episode.end), "HH:mm")
                  : ""}
              {/if}
            </p>
          </div>
        </div>
      </div>

      {#if success || form?.success}
        <div class="p-6 mb-8 bg-blue/20 border border-blue rounded">
          <h3 class="mb-2">Success!</h3>
          <p>
            Your episode information has been updated successfully. Thank you!
          </p>
        </div>
      {:else if currentStep === 1}
        <div class="space-y-6">
          {#if formContent}
            <div class="prose prose-invert max-w-none">
              {@html formContent}
            </div>
          {/if}

          {#if resources.length > 0}
            <div class="border-t border-white/20 pt-6">
              <h3 class="text-lg uppercase letter-spacing-wide mb-4">
                Resources
              </h3>
              <ul class="space-y-2">
                {#each resources as file}
                  <li>
                    <a
                      href="https://cms.radiodopo.it/assets/{file.id}"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="flex items-center gap-2 text-pink hover:opacity-70 transition-opacity"
                    >
                      {file.title || file.filename_download}
                    </a>
                  </li>
                {/each}
              </ul>
            </div>
          {/if}

          <div class="border-t border-white/20 pt-6">
            <label class="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                bind:checked={infoRead}
                class="mt-1 w-5 h-5 flex-shrink-0 cursor-pointer"
              />
              <span class="text-lg"
                >I have read and understood the above information.</span
              >
            </label>
          </div>

          <div class="pt-2">
            <button
              type="button"
              disabled={!infoRead}
              on:click={() => (currentStep = 2)}
              class="px-8 py-4 bg-pink text-black rounded no-underline text-lg uppercase letter-spacing-wide disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        </div>
      {:else}
        <form
          method="POST"
          action="?/submit&id={episode.id}"
          use:enhance={() => {
            submitting = true;
            return async ({ result, update }) => {
              submitting = false;
              if (result.type === "success") success = true;
              await update();
            };
          }}
        >
          <!-- Hidden file IDs -->
          <input type="hidden" name="image_id" value={imageId || ""} />
          <input type="hidden" name="audio_id" value={audioId || ""} />
          <!-- Hidden translation IDs -->
          {#if enTranslation?.id}
            <input
              type="hidden"
              name="en_translation_id"
              value={enTranslation.id}
            />
          {/if}
          {#if itTranslation?.id}
            <input
              type="hidden"
              name="it_translation_id"
              value={itTranslation.id}
            />
          {/if}

          <div class="space-y-6">
            <!-- Title -->
            <div>
              <label
                for="title"
                class="block mb-2 text-lg uppercase letter-spacing-wide"
              >
                Episode Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={form?.title || episode.title || ""}
                required
                class="w-full"
                placeholder="Enter episode title"
              />
            </div>

            <!-- Image -->
            <div>
              <label class="block mb-2 text-lg uppercase letter-spacing-wide">
                Image *
              </label>
              <input
                type="file"
                id="image"
                accept="image/*"
                on:change={handleImageChange}
                class="hidden"
              />
              <div
                class="border-2 border-dashed rounded p-6 text-center cursor-pointer transition-colors {isDragging
                  ? 'border-orange bg-orange/10'
                  : 'border-white/30 hover:border-white/50'}"
                on:click={() => document.getElementById("image").click()}
                on:drop={handleImageDrop}
                on:dragover={(e) => {
                  e.preventDefault();
                  isDragging = true;
                }}
                on:dragleave={() => {
                  isDragging = false;
                }}
                role="button"
                tabindex="0"
              >
                {#if imageUploading}
                  <div class="py-8 space-y-2">
                    <svg
                      class="w-8 h-8 mx-auto animate-spin opacity-70"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        class="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        stroke-width="4"
                      />
                      <path
                        class="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    <p class="text-sm opacity-70">Uploading...</p>
                  </div>
                {:else if imagePreview && imageId}
                  <div class="space-y-4">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      class="max-h-64 mx-auto rounded"
                    />
                    <p class="text-sm opacity-70">
                      {imageName} — Click or drop to change
                    </p>
                  </div>
                {:else}
                  <div class="py-8 space-y-2">
                    <svg
                      class="w-16 h-16 mx-auto opacity-50"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p class="text-lg">Drag and drop an image here</p>
                    <p class="text-sm opacity-70">or click to browse</p>
                  </div>
                {/if}
              </div>
              {#if imageError}
                <p class="mt-2 text-red-400">{imageError}</p>
              {/if}
            </div>

            <!-- Audio - Pre-records only -->
            {#if isPreRecord}
              <div>
                <label class="block mb-2 text-lg uppercase letter-spacing-wide">
                  Audio *
                </label>
                <p class="text-sm opacity-70 mb-3">320kbps MP3. Max 350MB.</p>
                <input
                  type="file"
                  id="audio"
                  accept="audio/*"
                  on:change={handleAudioChange}
                  class="hidden"
                />
                <div
                  class="border-2 border-dashed rounded p-6 text-center cursor-pointer transition-colors {isAudioDragging
                    ? 'border-orange bg-orange/10'
                    : 'border-white/30 hover:border-white/50'}"
                  on:click={() => document.getElementById("audio").click()}
                  on:drop={handleAudioDrop}
                  on:dragover={(e) => {
                    e.preventDefault();
                    isAudioDragging = true;
                  }}
                  on:dragleave={() => {
                    isAudioDragging = false;
                  }}
                  role="button"
                  tabindex="0"
                >
                  {#if audioUploading}
                    <div class="py-8 space-y-2">
                      <svg
                        class="w-8 h-8 mx-auto animate-spin opacity-70"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          class="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          stroke-width="4"
                        />
                        <path
                          class="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      <p class="text-sm opacity-70">Uploading...</p>
                    </div>
                  {:else if audioId}
                    <div class="py-4 space-y-2">
                      <svg
                        class="w-10 h-10 mx-auto opacity-70"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                        />
                      </svg>
                      <p class="text-lg">{audioName}</p>
                      <p class="text-sm opacity-70">
                        {(audioSize / 1024 / 1024).toFixed(1)}MB — Click or drop
                        to change
                      </p>
                    </div>
                  {:else}
                    <div class="py-8 space-y-2">
                      <svg
                        class="w-16 h-16 mx-auto opacity-50"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                        />
                      </svg>
                      <p class="text-lg">Drag and drop audio here</p>
                      <p class="text-sm opacity-70">or click to browse</p>
                    </div>
                  {/if}
                </div>
                {#if audioError}
                  <p class="mt-2 text-red-400">{audioError}</p>
                {/if}
              </div>
            {/if}

            <!-- Tracklist - Pre-records only -->
            {#if isPreRecord}
              <div>
                <label
                  for="tracklist"
                  class="block mb-2 text-lg uppercase letter-spacing-wide"
                >
                  Tracklist
                </label>
                <textarea
                  id="tracklist"
                  name="tracklist"
                  rows="8"
                  class="w-full bg-transparent border border-white p-4 text-white resize-vertical"
                  placeholder="Track title - artist name"
                  style="font-size: 1.25rem; line-height: 1.6;"
                  >{form?.tracklist || episode.tracklist || ""}</textarea
                >
              </div>
            {/if}

            <!-- Descriptions (at least one required) -->
            <div class="space-y-6">
              <div>
                <label
                  for="description_it"
                  class="block mb-2 text-lg uppercase letter-spacing-wide"
                >
                  Description (IT)
                </label>
                <textarea
                  id="description_it"
                  name="description_it"
                  rows="8"
                  bind:value={descriptionIt}
                  class="w-full bg-transparent border border-white p-4 text-white resize-vertical"
                  placeholder="Inserisci la descrizione dell'episodio in italiano"
                  style="font-size: 1.25rem; line-height: 1.6;"
                ></textarea>
              </div>

              <div>
                <label
                  for="description_en"
                  class="block mb-2 text-lg uppercase letter-spacing-wide"
                >
                  Description (EN)
                </label>
                <textarea
                  id="description_en"
                  name="description_en"
                  rows="8"
                  bind:value={descriptionEn}
                  class="w-full bg-transparent border border-white p-4 text-white resize-vertical"
                  placeholder="Enter episode description in English"
                  style="font-size: 1.25rem; line-height: 1.6;"
                ></textarea>
              </div>

              {#if !hasDescription}
                <p class="text-red-400">At least one description (EN or IT) is required.</p>
              {/if}
            </div>

            {#if form?.error}
              <div class="p-4 bg-red/20 border border-red rounded">
                <p class="text-red">{form.error}</p>
              </div>
            {/if}

            <div class="pt-4 flex items-center gap-4">
              <button
                type="button"
                on:click={() => (currentStep = 1)}
                class="px-6 py-4 border border-white/30 text-white rounded no-underline text-lg uppercase letter-spacing-wide hover:border-white/60"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={submitting ||
                  imageUploading ||
                  audioUploading ||
                  !imageId ||
                  (isPreRecord && !audioId) ||
                  !hasDescription}
                class="px-8 py-4 bg-pink text-black rounded no-underline text-lg uppercase letter-spacing-wide disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {#if submitting}
                  Submitting...
                {:else if imageUploading || audioUploading}
                  Uploading files...
                {:else}
                  Submit Episode Info
                {/if}
              </button>
            </div>
          </div>
        </form>
      {/if}
    {/if}
  </div>
</div>

<style>
  textarea {
    font-family: inherit;
    outline: none;
  }

  textarea::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  @media screen and (min-width: 768px) {
    textarea {
      font-size: 1.5rem;
    }
  }

  :global(.prose h1, .prose h2, .prose h3) {
    color: inherit;
    margin-top: 1.5em;
    margin-bottom: 0.5em;
  }

  :global(.prose p) {
    margin-bottom: 1em;
    line-height: 1.7;
  }

  :global(.prose ul, .prose ol) {
    padding-left: 1.5em;
    margin-bottom: 1em;
  }

  :global(.prose li) {
    margin-bottom: 0.25em;
  }

  :global(.prose a) {
    text-decoration: underline;
  }

  :global(.prose strong) {
    font-weight: 700;
  }
</style>

<script>
  import { tick } from "svelte";

  /** @type {{ id: any, label: string }[]} */
  export let options = [];

  /** @type {any[]} */
  export let selected = [];

  export let max = 4;
  export let placeholder = "Search...";

  let query = "";
  let open = false;
  let highlightIndex = -1;
  let inputEl;
  let containerEl;
  let listEl;

  $: filtered = query
    ? options.filter(
        (o) =>
          !selected.includes(o.id) &&
          o.label.toLowerCase().includes(query.toLowerCase())
      )
    : options.filter((o) => !selected.includes(o.id));

  $: selectedItems = options.filter((o) => selected.includes(o.id));

  $: if (filtered) highlightIndex = -1;

  function select(id) {
    if (selected.length >= max) return;
    selected = [...selected, id];
    query = "";
    highlightIndex = -1;
    inputEl?.focus();
  }

  function remove(id) {
    selected = selected.filter((s) => s !== id);
    tick().then(() => inputEl?.focus());
  }

  function scrollToHighlighted() {
    tick().then(() => {
      if (!listEl) return;
      const el = listEl.querySelector('[data-highlighted="true"]');
      if (el) el.scrollIntoView({ block: "nearest" });
    });
  }

  function handleKeydown(e) {
    if (e.key === "Backspace" && !query && selected.length > 0) {
      selected = selected.slice(0, -1);
      return;
    }
    if (e.key === "Escape") {
      open = false;
      highlightIndex = -1;
      inputEl?.blur();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) open = true;
      highlightIndex = Math.min(highlightIndex + 1, filtered.length - 1);
      scrollToHighlighted();
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      highlightIndex = Math.max(highlightIndex - 1, 0);
      scrollToHighlighted();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIndex >= 0 && highlightIndex < filtered.length) {
        select(filtered[highlightIndex].id);
      }
      return;
    }
  }

  function handleFocus() {
    open = true;
  }

  function handleClickOutside(e) {
    if (containerEl && !containerEl.contains(e.target)) {
      open = false;
      highlightIndex = -1;
    }
  }
</script>

<svelte:window on:mousedown={handleClickOutside} />

<div class="relative" bind:this={containerEl}>
  <div
    class="flex flex-wrap items-center gap-2 border-b border-white pb-2 cursor-text"
    role="combobox"
    aria-expanded={open}
    aria-controls="multiselect-listbox"
    aria-haspopup="listbox"
    tabindex="-1"
    on:click={() => inputEl?.focus()}
    on:keydown={() => inputEl?.focus()}
  >
    {#each selectedItems as item (item.id)}
      <span class="flex items-center gap-1.5 px-3 py-1 text-sm bg-white/10 rounded-full text-white">
        {item.label}
        <button
          type="button"
          class="!no-underline text-white/50 hover:text-white leading-none text-base"
          on:click|stopPropagation={() => remove(item.id)}
          aria-label="Remove {item.label}"
        >
          <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
            <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
          </svg>
        </button>
      </span>
    {/each}
    {#if selected.length < max}
      <input
        bind:this={inputEl}
        type="text"
        bind:value={query}
        on:focus={handleFocus}
        on:keydown={handleKeydown}
        {placeholder}
        role="searchbox"
        aria-autocomplete="list"
        class="flex-1 min-w-[120px] !border-none !pb-0 !text-base bg-transparent outline-none"
      />
    {/if}
  </div>

  {#if open && filtered.length > 0}
    <ul
      bind:this={listEl}
      id="multiselect-listbox"
      role="listbox"
      class="absolute z-50 left-0 right-0 mt-1 max-h-[240px] overflow-y-auto bg-[#1a1a1a] border border-white/20 rounded list-none p-0 m-0"
    >
      {#each filtered as option, i (option.id)}
        <li role="option" aria-selected={i === highlightIndex} data-highlighted={i === highlightIndex}>
          <button
            type="button"
            class="!no-underline w-full text-left px-4 py-2 transition-colors text-base cursor-pointer {i === highlightIndex ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'}"
            on:click={() => select(option.id)}
            disabled={selected.length >= max}
            tabindex="-1"
          >
            {option.label}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

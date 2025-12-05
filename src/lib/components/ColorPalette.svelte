<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let visible: boolean = false;

  const colors = [
    '#fef3c7', // Amber (classic yellow)
    '#dcfce7', // Green
    '#dbeafe', // Blue
    '#fce7f3', // Pink
    '#f3f4f6', // Grey/White
    '#ffedd5', // Orange
  ];

  const dispatch = createEventDispatcher();

  function selectColor(color: string) {
    dispatch('select', color);
  }
</script>

{#if visible}
  <div class="flex flex-col gap-3 mb-4 transition-all duration-300 origin-bottom animate-in fade-in slide-in-from-bottom-4">
    {#each colors as color}
      <button
        on:click={() => selectColor(color)}
        class="w-10 h-10 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform"
        style="background-color: {color};"
        aria-label="Select color"
      ></button>
    {/each}
  </div>
{/if}
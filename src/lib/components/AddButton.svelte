<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade, fly } from 'svelte/transition';

  const dispatch = createEventDispatcher();
  
  let isOpen = false;

  const colors = [
    '#fef3c7', // Yellow
    '#dcfce7', // Green
    '#dbeafe', // Blue
    '#fce7f3', // Pink
    '#f3f4f6', // Grey
    '#ffedd5', // Orange
  ];

  function selectColor(color: string) {
    isOpen = false;
    dispatch('openModal', color);
  }
</script>

<div class="fixed bottom-6 right-6 flex flex-col items-center gap-3 z-50 md:hidden">
  
  {#if isOpen}
    <div class="flex flex-col gap-3 mb-2" transition:fade={{ duration: 150 }}>
      {#each colors as color, i}
        <button
          on:click={() => selectColor(color)}
          in:fly={{ y: 20, duration: 300, delay: i * 50 }}
          out:fly={{ y: 20, duration: 200 }}
          class="w-10 h-10 rounded-full border-2 border-white shadow-md hover:scale-110 active:scale-90 transition-transform"
          style="background-color: {color};"
          aria-label="Select color"
        ></button>
      {/each}
    </div>
  {/if}

  <button
    on:click={() => (isOpen = !isOpen)}
    class="w-14 h-14 bg-black text-white rounded-full shadow-xl flex items-center justify-center 
           text-3xl hover:scale-110 transition-transform duration-200 active:scale-95 z-50"
    aria-label="Toggle palette"
  >
    <span class="transition-transform duration-300 {isOpen ? 'rotate-45' : 'rotate-0'}">
      +
    </span>
  </button>
</div>
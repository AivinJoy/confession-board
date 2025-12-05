<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import { notesStore } from '$lib/stores/notesStore';
  import { enhance } from '$app/forms';

  export let isOpen: boolean;
  export let color: string;
  
  // NEW: Props for Editing
  export let editMode = false;
  export let noteData: any = null;

  const dispatch = createEventDispatcher();
  let loading = false;

  // 1. Determine Logic based on Mode
  $: formAction = editMode ? '?/update' : '?/create';
  
  // Use existing color if editing, otherwise use the picker color
  $: currentColor = editMode && noteData ? noteData.color : color;

  // Initialize text (If editing, load existing content. If new, empty.)
  // We use a reactive statement so it updates if you switch notes quickly
  let text = '';
  $: if (isOpen) {
    text = editMode && noteData ? noteData.content : '';
  }

  // 2. Serial Number Logic
  // If Editing -> Show that note's ID. 
  // If Creating -> Calculate max + 1.
  $: maxId = $notesStore.length > 0 ? Math.max(...$notesStore.map(n => n.id)) : 0;
  $: displayId = editMode && noteData ? noteData.id : maxId + 1;

  function handleClose() {
    dispatch('close');
    loading = false;
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) handleClose();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') handleClose();
  }

  function focusOnMount(node: HTMLElement) {
    node.focus();
  }
</script>

{#if isOpen}
  <div 
    class="fixed inset-0 bg-black/40 backdrop-blur-sm z-10000 flex items-center justify-center p-4"
    transition:fade={{ duration: 200 }}
    on:click={handleBackdropClick}
    on:keydown={handleKeydown}
    role="button"
    tabindex="0"
  >
    <form 
      method="POST" 
      action={formAction}
      class="relative w-[280px] h-[280px] p-6 shadow-2xl rotate-1 flex flex-col"
      style="background-color: {currentColor};"
      transition:scale={{ duration: 250, start: 0.9 }}
      use:enhance={() => {
        loading = true;
        return async ({ result, update }) => {
          loading = false;
          
          if (result.type === 'success') {
            handleClose();
            update(); 
          } else if (result.type === 'failure') {
            // Show the error message from the server
            // @ts-ignore
            alert(result.data?.error || 'Action failed');
          }
        };
      }}
    >
      <button 
        type="button"
        on:click={handleClose}
        class="absolute -top-3 -right-3 bg-white text-black rounded-full w-8 h-8 shadow-md flex items-center justify-center font-bold hover:scale-110 transition z-20"
      >
        &times;
      </button>

      <span class="absolute top-2 left-1/2 -translate-x-1/2 text-xs font-mono text-black/40 font-bold z-10 select-none">
        #{displayId}
      </span>

      <input type="hidden" name="color" value={currentColor} />
      
      {#if editMode}
        <input type="hidden" name="id" value={noteData.id} />
      {/if}

      <div class="flex-1 flex flex-col relative pt-4">
        <h3 class="text-center font-mono text-xs opacity-50 mb-2 font-bold tracking-widest">
          {editMode ? 'EDIT NOTE' : 'NEW NOTE'}
        </h3>
        
        <textarea
          name="content"
          bind:value={text}
          use:focusOnMount
          class="w-full grow bg-transparent resize-none outline-none border-none ring-0 focus:ring-0 font-handwriting text-lg leading-relaxed placeholder-gray-500/50"
          placeholder="Type your confession here..."
          maxlength="150"
        ></textarea>
        
        <div class="flex gap-2 mt-4">
          {#if editMode}
            <button 
              type="submit"
              formaction="?/delete"
              disabled={loading}
              class="flex-1 py-2 bg-red-500/20 hover:bg-red-500/40 text-red-900 font-bold rounded transition disabled:opacity-50"
            >
              DELETE
            </button>
            
            <button 
              type="submit"
              disabled={!text.trim() || loading}
              class="flex-1 py-2 bg-black/10 hover:bg-black/20 text-black/80 font-bold rounded transition disabled:opacity-50"
            >
              {loading ? 'SAVING...' : 'UPDATE'}
            </button>
          {:else}
            <button
              type="submit"
              disabled={!text.trim() || loading}
              class="w-full py-2 bg-black/10 hover:bg-black/20 text-black/80 font-bold rounded transition disabled:opacity-50"
            >
              {loading ? 'POSTING...' : 'POST IT'}
            </button>
          {/if}
        </div>

      </div>
    </form>
  </div>
{/if}

<style>
  .font-handwriting { font-family: 'Courier New', Courier, monospace; }
</style>
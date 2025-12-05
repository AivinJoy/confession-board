<script lang="ts">
  import { notesStore, hydrateRawNotes } from '$lib/stores/notesStore';
  import StickyNote from '$lib/components/StickyNote.svelte';
  import AddButton from '$lib/components/AddButton.svelte';
  import StickyModal from '$lib/components/StickyModal.svelte';
  import { slide } from 'svelte/transition';
  import type { PageData } from './$types';

  export let data: PageData;

  // 1. UPDATE: Handle Data Mapping & Layout
  $: if (data.rawConfessions) {
    // A. Map DB content to Store format
    const mappedData = data.rawConfessions.map((note: any) => ({
      ...note,
      text: note.content 
    }));
    
    // B. Calculate Layout (Positions)
    const hydrated = hydrateRawNotes(mappedData);

    // C. CRITICAL MERGE STEP:
    // hydrateRawNotes might strip 'student_id', so we put it back manually.
    const finalNotes = hydrated.map(note => {
      const original = data.rawConfessions.find((r: any) => r.id === note.id);
      return {
        ...note,
        student_id: original?.student_id,
        created_at: original?.created_at
      };
    });

    notesStore.setNotes(finalNotes);
  }

  // --- STATE ---
  let isModalOpen = false;
  let selectedColor = '#fef3c7';
  let showDesktopPalette = false;

  let editMode = false;
  let selectedNote: any = null;

  const colors = ['#fef3c7', '#dcfce7', '#dbeafe', '#fce7f3', '#f3f4f6', '#ffedd5'];

  function openModal(color: string) {
    editMode = false;
    selectedNote = null;
    selectedColor = color;
    isModalOpen = true;
    showDesktopPalette = false;
  }

  // --- HANDLE CLICK (Permissions Check) ---
  function handleNoteClick(note: any) {
    // @ts-ignore
    const studentId = data.currentUser;
    // @ts-ignore
    const userRole = data.userRole;

    const isOwner = note.student_id === studentId;
    const isAdmin = userRole === 'admin';

    // --- FIX TIMEZONE ISSUE ---
    // The DB sends time like "2023-10-25T10:00:00". Browser reads as IST.
    // We add 'Z' to force it to read as UTC ("2023-10-25T10:00:00Z").
    let timeString = note.created_at;
    if (!timeString.endsWith('Z') && !timeString.includes('+')) {
      timeString += 'Z'; 
    }
    
    const noteTime = new Date(timeString).getTime();
    const minutesDiff = (Date.now() - noteTime) / 1000 / 60;
    // ---------------------------

    // DEBUG: This should now be close to 0.0 mins for new notes
    console.log(`Time Diff: ${minutesDiff.toFixed(2)} mins`);

    if (isAdmin || (isOwner && minutesDiff <= 2)) {
      editMode = true;
      selectedNote = {
        ...note,
        content: note.text 
      };
      selectedColor = note.color;
      isModalOpen = true;
    } else {
      console.log(`Cannot edit. Owner? ${isOwner}. Time Diff: ${minutesDiff.toFixed(1)} mins`);
    }
  }

  // Height Logic
  $: boardHeight = $notesStore.length > 0 
      ? Math.max(200, Math.max(...$notesStore.map(n => n.y)) + 350) 
      : 200;
</script>

<div class="min-h-screen bg-gray-200 font-sans text-neutral-900 flex flex-col items-center relative p-0 md:p-8">

  <div class="hidden md:flex bg-white rounded-3xl shadow-xl w-full max-w-7xl relative transition-all overflow-hidden flex-row">
    
    <div class="w-24 border-r border-gray-300 flex flex-col items-center py-8 gap-6 shrink-0 bg-gray-50/30">
      <div class="sticky top-8 flex flex-col gap-6 items-center">
        <button 
          on:click={() => showDesktopPalette = !showDesktopPalette}
          class="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center text-2xl hover:scale-110 transition-transform shadow-lg z-20 shrink-0"
          aria-label="Toggle Palette"
        >
          <span class="transition-transform duration-300 {showDesktopPalette ? 'rotate-45' : 'rotate-0'}">+</span>
        </button>

        {#if showDesktopPalette}
          <div class="flex flex-col gap-3 w-full items-center" transition:slide={{ duration: 300, axis: 'y' }}>
            {#each colors as color}
              <button 
                on:click={() => openModal(color)} 
                class="w-8 h-8 rounded-full border border-black/10 hover:scale-125 transition-all" 
                style="background-color: {color};"
                aria-label="Select color"
              ></button>
            {/each}
            <div class="w-8 h-px bg-gray-400 my-1"></div>
          </div>
        {/if}

        <a href="https://instagram.com/vast_confessions_official" target="_blank" class="w-8 h-8 hover:opacity-80 transition-opacity" aria-label="Instagram">
           <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="ig-grad-d" x1="0" y1="24" x2="24" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FFDC80"/><stop offset="0.25" stop-color="#FCAF45"/><stop offset="0.5" stop-color="#F56040"/><stop offset="0.75" stop-color="#E1306C"/><stop offset="1" stop-color="#C13584"/></linearGradient></defs><rect x="2" y="2" width="20" height="20" rx="6" stroke="url(#ig-grad-d)" stroke-width="2"/><circle cx="12" cy="12" r="4" stroke="url(#ig-grad-d)" stroke-width="2"/><circle cx="18" cy="6" r="1" fill="url(#ig-grad-d)"/></svg>
        </a>
        
        </div>
    </div>

    <div class="grow flex flex-col relative pb-20"> 
      <div class="h-32 flex flex-col items-center justify-center border-b border-gray-200 shrink-0 z-10 bg-white">
        <h1 class="text-4xl font-extrabold tracking-tight text-gray-800">VAST CONFESSIONS</h1>
        <p class="text-gray-400 italic mt-2 font-serif text-lg">~Share Your Heart Anonymously</p>
      </div>

      <div class="relative w-full transition-all ease-linear duration-500" style="height: {boardHeight}px;">
        {#each $notesStore as note (note.id)}
          <div 
            class="contents cursor-pointer"
            on:click={() => handleNoteClick(note)}
            on:keydown={() => {}}
            role="button"
            tabindex="0"
          >
            <StickyNote {note} />
          </div>
        {/each}

        {#if $notesStore.length === 0}
          <div class="absolute inset-0 flex items-start justify-center pt-20 opacity-10 pointer-events-none">
            <p class="text-3xl font-bold tracking-widest uppercase text-gray-300">Board Empty</p>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <div class="md:hidden flex flex-col bg-white shadow-xl w-full min-h-[50vh] overflow-hidden relative mb-20">
    <header class="w-full bg-white pt-6 pb-2 px-4 z-40 shrink-0">
      <div class="text-center mb-4">
        <h1 class="text-2xl font-bold text-gray-900">VAST CONFESSIONS</h1>
        <p class="text-xs text-gray-500 italic mt-1">~Share Your Heart Anonymously</p>
      </div>
      <div class="w-full h-px bg-gray-800"></div>
    </header>

    <main class="relative grow w-full bg-white">
      <div class="relative w-full transition-all ease-linear duration-500" style="height: {boardHeight}px;">
        {#each $notesStore as note (note.id)}
           <div 
            class="contents"
            on:click={() => handleNoteClick(note)}
            on:keydown={() => {}}
            role="button"
            tabindex="0"
          >
            <StickyNote {note} />
          </div>
        {/each}
        
        {#if $notesStore.length === 0}
          <div class="absolute inset-0 flex items-start justify-center pt-20 opacity-10 pointer-events-none">
            <p class="text-xl font-bold tracking-widest uppercase text-gray-200">Board Empty</p>
          </div>
        {/if}
      </div>
    </main>
  </div>

  <AddButton on:openModal={(e) => openModal(e.detail)} />
  
  <StickyModal 
    isOpen={isModalOpen} 
    color={selectedColor} 
    editMode={editMode}
    noteData={selectedNote}
    on:close={() => isModalOpen = false} 
  />
</div>
<script lang="ts">
  import type { Note } from '$lib/stores/notesStore';

  export let note: Note;
</script>

<div
  class="absolute p-5 shadow-md transition-all duration-300 ease-out 
         hover:scale-110 hover:shadow-2xl cursor-pointer
         flex flex-col group overflow-hidden
         w-40 h-40 md:w-48 md:h-48"
  style="
    background-color: {note.color};
    left: {note.x}%; 
    top: {note.y}px;
    transform: rotate({note.rotation}deg);
    z-index: {note.zIndex};
  "
>
  <div class="absolute inset-0 pointer-events-none group-hover:z-9999" style="z-index: inherit;"></div>

  <div class="absolute inset-0 opacity-10 pointer-events-none bg-linear-to-br from-white to-transparent mix-blend-overlay"></div>

  <span class="absolute top-2 right-2 text-[10px] font-mono opacity-50 font-bold z-20 select-none">
    #{note.id}
  </span>

  <div class="relative z-10 w-full h-full pt-4 overflow-hidden">
    <p class="font-handwriting text-neutral-800 text-sm leading-snug wrap-break-word font-medium w-full h-full overflow-hidden text-ellipsis">
      {note.text}
    </p>
  </div>

  <div class="absolute bottom-0 right-0 w-8 h-8 bg-black/5 blur-md rounded-full translate-x-3 translate-y-3 pointer-events-none"></div>
</div>

<style>
  div:hover {
    z-index: 1000 !important;
  }

  .font-handwriting {
    font-family: 'Courier New', Courier, monospace; 
  }
</style>
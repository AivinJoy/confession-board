import { writable } from 'svelte/store';

export interface Note {
  id: number;
  text: string;
  color: string;
  rotation: number;
  x: number;
  y: number;
  zIndex: number;
}

function createNotesStore() {
  const { subscribe, set } = writable<Note[]>([]);
  return { subscribe, setNotes: (notes: Note[]) => set(notes) };
}

export const notesStore = createNotesStore();

// Maps your DB data to the Visual Layout
export function hydrateRawNotes(rawNotes: any[]): Note[] {
  return rawNotes.map((rawNote, index) => {
    // Grid + Messy Logic
    const colIndex = index % 3; 
    const rowIndex = Math.floor(index / 3);

    const baseX = (colIndex * 30) + 5; 
    const baseY = (rowIndex * 160) + 20;

    const jitterX = (Math.random() * 30) - 15;
    const jitterY = (Math.random() * 60) - 30;

    return {
      id: rawNote.id,       // Uses the REAL ID from DB (#74, #73, etc)
      text: rawNote.content,// Maps 'content' column to 'text'
      color: rawNote.color, // Maps 'color' column
      rotation: Math.random() * 16 - 8,
      x: Math.max(2, Math.min(75, baseX + jitterX)),
      y: Math.max(20, baseY + jitterY),
      zIndex: rawNotes.length - index
    };
  });
}
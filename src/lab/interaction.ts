import { create } from 'zustand';
import type { ItemId } from './registry';

// A picked object disappears before the browser dispatches its following click.
// Keep that click from selecting a room object revealed behind it.
let consumedPointerAt = -Infinity;
export const consumeLabPointer = () => { consumedPointerAt = performance.now(); };
export const labOwnsClick = () => useInteraction.getState().held !== null || performance.now() - consumedPointerAt < 250;

// Presentation and pointer choices never enter chemical inventories or saved snapshots.
export const useInteraction = create<{
  held: ItemId | null; hovered: ItemId | null;
  completed: number; observed: boolean;
  bookOpen: boolean; reference: ItemId | null;
  roomReference: {name:string;description:string}|null;
  referRoom: (reference:{name:string;description:string})=>void;
  openBook: (open: boolean) => void; refer: (id: ItemId) => void;
  pick: (id: ItemId) => void; cancel: () => void; hover: (id: ItemId | null) => void;
  resetProgress: () => void; complete: (count: number) => void; observe: () => void;
}>((set) => ({
  held: null, hovered: null, completed: 0, observed: false,
  bookOpen: false, reference: null, roomReference:null,
  referRoom: roomReference => set({roomReference,reference:null}),
  openBook: bookOpen => set({ bookOpen }), refer: reference => set({ reference,roomReference:null }),
  pick: held => set({ held, hovered: null }), cancel: () => set({ held: null, hovered: null }),
  hover: hovered => set({ hovered }),
  resetProgress: () => set({ completed: 0, observed: false, held: null, hovered: null }),
  complete: count => set(s => ({ completed: Math.max(s.completed, count) })), observe: () => set({ observed: true }),
}));

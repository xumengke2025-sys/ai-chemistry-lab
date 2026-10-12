import { create } from 'zustand';

export type Exhibit = 'room' | 'bench' | 'balance' | 'retort' | 'bell' | 'interactive' | 'furniture';
export interface RoomFocus { id: string; name: string; description: string; target: [number,number,number]; position: [number,number,number] }
export const useLabStore = create<{
  exhibit: Exhibit;
  revision: number;
  roomFocus: RoomFocus | null;
  inspectRoom: (focus: RoomFocus) => void;
  select: (exhibit: Exhibit) => void;
}>((set) => ({ exhibit: 'room', revision: 0, roomFocus: null,
  inspectRoom: roomFocus => set(state => ({roomFocus, exhibit:'furniture', revision:state.revision+1})),
  select: (exhibit) => set((state) => ({ exhibit, revision: state.revision + 1 })) }));

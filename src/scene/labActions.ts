import { clickTargets, type DropTarget } from '../lab/guidance';
import { useInteraction } from '../lab/interaction';
import { items, type ItemId, type Position } from '../lab/registry';
import { useWorld } from '../lab/world';
import { useLabStore } from '../store';

export function pickObject(id: ItemId) {
  const w=useWorld.getState();w.setAngle(0);w.setBusy(false);
  useInteraction.getState().pick(id);w.inspect(null);useLabStore.getState().select('bench');
}

export function placeHeld(target: DropTarget) {
  const held=useInteraction.getState().held;if(!held)return;
  const w=useWorld.getState();
  if(!clickTargets(w,held).some(t=>t.id===target.id&&!!t.home===!!target.home))return;
  const p:Position=target.id==='recovery'?[-.8,1.49,1.22]:target.home?[...items[target.id].home]:[...w.positions[target.id]];
  w.drop(held,p);useInteraction.getState().cancel();w.inspect(null);useLabStore.getState().select('bench');
}

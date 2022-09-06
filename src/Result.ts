import { Command, Display, GameState } from './Action';

export type Result = (
  command: Command,
  state: GameState,
  display: Display
) => void;

export function doNothing(): Result {
  return (command, state, display) => {};
}

export function print(message: string | undefined): Result {
  return (command, state, display) => display(message);
}

export function quit(): Result {
  return (command, state, display) => state.quit();
}

export function inventory(): Result {
  return (command, state, display) => state.inventory(display);
}

export function swap(item1: string, item2: string): Result {
  return (command, state, display) => state.swap(item1, item2);
}

export function move(room: string): Result {
  return (command, state, display) => state.move(room);
}

export function put(item: string, room?: string): Result {
  return (command, state, display) => state.put(item, room);
}

export function get(item: string): Result {
  return (command, state, display) => state.get(item);
}

export function drop(item: string): Result {
  return (command, state, display) => state.drop(item);
}

export function putWith(item1: string, item2: string): Result {
  return (command, state, display) => state.putWith(item1, item2);
}

export function destroy(item: string): Result {
  return (command, state, display) => state.destroy(item);
}

export function setFlag(name: string, val: boolean): Result {
  return (command, state, display) => state.setFlag(name, val);
}

export function resetFlag(name: string): Result {
  return (command, state, display) => state.resetFlag(name);
}

export function setCounter(name: string, val: number): Result {
  return (command, state, display) => state.setCounter(name, val);
}

export function incrementCounter(name: string): Result {
  return (command, state, display) => state.incrementCounter(name);
}

export function decrementCounter(name: string): Result {
  return (command, state, display) => state.decrementCounter(name);
}

export function resetCounter(name: string): Result {
  return (command, state, display) => state.resetCounter(name);
}

export function setString(key: string, value: string): Result {
  return (command, state, display) => state.setString(key, value);
}

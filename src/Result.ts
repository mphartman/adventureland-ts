import { Command } from './Action';
import { GameState } from './GameState';
import { Display } from './Display';

export type Result = (
  command: Command,
  state: GameState,
  display: Display
) => void;

export function print(message: string): Result {
  return (_command, state, display) => state.print(display, message);
}

export function look(): Result {
  return (_command, state, display) => state.describe(display);
}

export function go(direction: string): Result {
  return (_command, state) => state.exitTowards(direction);
}

export function goInDirectionMatchingCommandWordAt(pos: number): Result {
  return (command, state) => state.exitTowards(command[pos - 1]?.name);
}

export function quit(): Result {
  return (_command, state) => state.quit();
}

export function inventory(): Result {
  return (_command, state, display) => state.inventory(display);
}

export function swap(item1: string, item2: string): Result {
  return (_command, state) => state.swap(item1, item2);
}

export function move(room: string): Result {
  return (_command, state) => state.move(room);
}

export function put(item: string, room?: string): Result {
  return (_command, state) => state.put(item, room);
}

export function get(item: string): Result {
  return (_command, state) => state.get(item);
}

export function drop(item: string): Result {
  return (_command, state) => state.drop(item);
}

export function putWith(item1: string, item2: string): Result {
  return (_command, state) => state.putWith(item1, item2);
}

export function destroy(item: string): Result {
  return (_command, state) => state.destroy(item);
}

export function setFlag(name: string, val: boolean): Result {
  return (_command, state) => state.setFlag(name, val);
}

export function resetFlag(name: string): Result {
  return (_command, state) => state.resetFlag(name);
}

export function setCounter(name: string, val: number): Result {
  return (_command, state) => state.setCounter(name, val);
}

export function incrementCounter(name: string): Result {
  return (_command, state) => state.incrementCounter(name);
}

export function decrementCounter(name: string): Result {
  return (_command, state) => state.decrementCounter(name);
}

export function resetCounter(name: string): Result {
  return (_command, state) => state.resetCounter(name);
}

export function setString(key: string, value: string): Result {
  return (_command, state) => state.setString(key, value);
}

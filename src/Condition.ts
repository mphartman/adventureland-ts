import { Command, GameState } from './Action';
import { Room } from './Room';
import { Word } from './Vocabulary';

export type Condition = (command: Command, state: GameState) => boolean;

export function always(): Condition {
  return (command, state) => true;
}

export function notever(): Condition {
  return (command, state) => false;
}

export function not(operand: Condition): Condition {
  return (command, state) => !operand(command, state);
}

export function or(operand1: Condition, operand2: Condition): Condition {
  return (command, state) =>
    operand1(command, state) || operand2(command, state);
}

export function and(operand1: Condition, operand2: Condition): Condition {
  return (command, state) =>
    operand1(command, state) && operand2(command, state);
}

export function wordMatches(position: number, word: Word): Condition {
  return (command, state) => command[position - 1]?.matches(word);
}

export function wordMatchesAny(position: number, ...words: Word[]): Condition {
  return (command, state) =>
    words.find((word) => command[position - 1]?.matches(word)) != undefined;
}

export function wordUnrecognized(position: number): Condition {
  return (command, state) => !command[position - 1]?.recognized;
}

export function hasExit(direction?: string): Condition {
  return (command, state) => state.currentRoom.hasExit(direction);
}

export function hasExitMatchingCommandWordAt(pos: number): Condition {
  return (command, state) => state.currentRoom.hasExit(command[pos - 1]);
}

export function inRoom(room: Room | string): Condition {
  if (typeof room === 'string') {
    return (command, state) => state.currentRoom.name === room;
  }
  return (command, state) => state.currentRoom.equals(room);
}

export function carrying(item: string): Condition {
  return (command, state) => state.carrying(item);
}

export function here(item: string): Condition {
  return (command, state) => state.here(item);
}

export function present(item: string): Condition {
  return or(carrying(item), here(item));
}

export function hasMoved(item: string): Condition {
  return (command, state) => state.hasMoved(item);
}

export function there(item: string, room: string): Condition {
  return (command, state) => state.here(item, room);
}

export function exists(item: string): Condition {
  return (command, state) => state.exists(item);
}

export function isFlagSet(name: string): Condition {
  return (command, state) => state.isFlagSet(name);
}

export function compareCounter(
  name: string,
  test: (i: number) => boolean
): Condition {
  return (command, state) => test(state.getCounter(name));
}

export function stringEquals(name: string, value: string): Condition {
  return (command, state) => value === state.getString(name);
}

export function random(
  probability: number,
  d100: () => number = getRandomArbitrary
): Condition {
  if (probability < 0 || probability > 100) {
    throw new Error(
      `probability must be a positive integer between 0 and 100 inclusive`
    );
  }
  return (command, state) => probability - d100() > 0;
}

function getRandomArbitrary(min: number = 1, max: number = 100) {
  return Math.random() * (max - min) + min;
}

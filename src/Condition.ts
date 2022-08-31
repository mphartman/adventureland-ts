import { Command, GameState } from './Action';
import { Room, Word } from './Adventure';

export type Condition = (command: Command, state: GameState) => boolean;

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

export function inRoom(room: Room | string): Condition {
  if (typeof room === 'string') {
    return (command, state) => state.currentRoom.name === room;
  }
  return (command, state) => state.currentRoom.equals(room);
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

import { Room, Word } from './Adventure';

export interface GameState {
  currentRoom: Room;
}

export type Display = (text: string) => void;

export type Command = Word[];

export type Condition = (command: Command, state: GameState) => boolean;

export type Result = (
  command: Command,
  state: GameState,
  display: Display
) => void;

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

export function inRoom(room: Room): Condition {
  return (command, state) => state.currentRoom.equals(room);
}

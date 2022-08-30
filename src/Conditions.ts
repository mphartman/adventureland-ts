import { Room, Word } from './Adventure';

export interface GameState {
  currentRoom: Room;
}

export type Command = Word;

export interface Condition {
  matches: (command: Command, gameState: GameState) => boolean;
}

export const not = (operand: Condition): Condition => {
  return {
    matches: (command: Command, gameState: GameState) =>
      !operand.matches(command, gameState),
  };
};

export const inRoom = (room: Room): Condition => {
  return {
    matches: (_: Command, gameState: GameState) =>
      gameState.currentRoom.equals(room),
  };
};

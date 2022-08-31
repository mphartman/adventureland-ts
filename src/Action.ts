import { Room, Word } from './Adventure';
import { Condition } from './Condition';
import { Result } from './Result';

export type Command = Word[];

export interface GameState {
  currentRoom: Room;
}

export type Display = (text: string | undefined) => void;

export class Action {
  constructor(
    readonly conditions: readonly Condition[],
    readonly results: readonly Result[]
  ) {}

  run(command: Command, state: GameState, display: Display): boolean {
    if (this.conditionsAllTrue(command, state)) {
      for (const result of this.results) {
        result(command, state, display);
      }
      return true;
    }
    return false;
  }

  private conditionsAllTrue(command: Command, state: GameState): boolean {
    for (const condition of this.conditions) {
      if (!condition(command, state)) {
        return false;
      }
    }
    return true;
  }
}

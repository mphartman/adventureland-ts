import { Condition } from './Condition';
import { Item } from './Item';
import { Result } from './Result';
import { Room } from './Room';
import { Word } from './Vocabulary';

export type Command = Word[];

export interface GameState {
  currentRoom: Room;
  describe: (display: Display) => void;
  exitTowards: (direction?: string) => void;
  quit: () => void;
  inventory: (display: Display) => void;
  swap: (item1: string, item2: string) => void;
  move: (room: string) => void;
  put: (item: string, room?: string) => void;
  get: (item: string) => void;
  drop: (item: string) => void;
  putWith: (item1: string, item2: string) => void;
  destroy: (item: string) => void;
  setFlag: (name: string, val: boolean) => void;
  resetFlag: (name: string) => void;
  setCounter: (name: string, val: number) => void;
  incrementCounter: (name: string) => void;
  decrementCounter: (name: string) => void;
  resetCounter: (name: string) => void;
  setString: (key: string, value: string) => void;
  carrying: (item: string) => boolean;
  here: (item: string, room?: string) => boolean;
  hasMoved: (item: string) => boolean;
  exists: (item: string) => boolean;
  isFlagSet: (name: string) => boolean;
  getCounter: (name: string) => number;
  getString: (name: string) => string | undefined;
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

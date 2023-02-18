import { Room } from './Room';
import { Display } from './Display';
import { Item } from './Item';

export interface GameState {
  running: boolean;
  currentRoom: Room;
  print: (display: Display, message: string) => void;
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
  getFlag: (name: string) => boolean;
  getCounter: (name: string) => number;
  getString: (name: string) => string | undefined;
}

export class DefaultGameState implements GameState {
  #running: boolean;
  #currentRoom: Room;
  #items: Item[];
  #rooms: Room[];
  #flags: Map<string, boolean>;
  #counters: Map<string, number>;
  #strings: Map<string, string>;

  constructor(
    startingRoom: Room,
    items: Readonly<Item[]>,
    rooms: Readonly<Room[]>
  ) {
    this.#running = true;
    this.#currentRoom = startingRoom;
    this.#items = Array.from(items);
    this.#rooms = Array.from(rooms);
    this.#flags = new Map<string, boolean>();
    this.#counters = new Map<string, number>();
    this.#strings = new Map<string, string>();
  }

  private findItem(name: string): Item | undefined {
    return this.#items.find((item) => item.name === name);
  }

  private findRoom(name: string | undefined): Room | undefined {
    return this.#rooms.find((room) => room.name === name);
  }

  print(display: Display, message: string): void {
    display(message);
  }

  get currentRoom(): Room {
    return this.#currentRoom;
  }

  get running(): boolean {
    return this.#running;
  }

  carrying(item: string): boolean {
    return this.findItem(item)?.isCarried() ?? false;
  }

  decrementCounter(name: string): void {
    this.#counters.set(name, (this.#counters.get(name) ?? 0) - 1);
  }

  describe(display: Display): void {
    display(this.#currentRoom.description);
    const itemsInRoom = this.#items.filter((item) =>
      item.isHere(this.#currentRoom)
    );
    if (itemsInRoom.length > 0) {
      if (itemsInRoom.length === 1) {
        display(`I can also see ${itemsInRoom[0].description}`);
      } else {
        display(
          `I can also see ${
            itemsInRoom.length
          } other things here: ${itemsInRoom.map((item, index) => {
            if (index > 0) {
              return `, ${item.description}`;
            } else if (index === itemsInRoom.length - 1) {
              return `and ${item.description}`;
            } else {
              return item.description;
            }
          })}`
        );
      }
    }
    const exits = this.#currentRoom.exits;
    if (exits.length == 0) {
      display(`There are no obvious exits.`);
    } else {
      if (exits.length == 1) {
        display(`There is a single exit to the ${exits[0].direction}`);
      } else {
        display(`There are ${exits.length} obvious exits: ${exits.join(',')}`);
      }
    }
  }

  destroy(item: string): void {
    this.findItem(item)?.destroy();
  }

  drop(item: string): void {
    this.findItem(item)?.drop(this.#currentRoom);
  }

  exists(item: string): boolean {
    return this.findItem(item) !== undefined;
  }

  exitTowards(direction: string | undefined): void {
    if (direction) {
      const room = this.findRoom(this.#currentRoom.exit(direction));
      if (room) {
        this.#currentRoom = room;
      }
    }
  }

  get(item: string): void {
    this.findItem(item)?.stow();
  }

  getCounter(name: string): number {
    return this.#counters.get(name) ?? 0;
  }

  getString(name: string): string | undefined {
    return this.#strings.get(name);
  }

  hasMoved(item: string): boolean {
    return this.findItem(item)?.hasMoved() ?? false;
  }

  here(item: string, room: string | undefined): boolean {
    if (room) {
      return this.findItem(item)?.isHere(room) ?? false;
    } else {
      return false;
    }
  }

  incrementCounter(name: string): void {
    this.#counters.set(name, (this.#counters.get(name) ?? 0) + 1);
  }

  inventory(display: Display): void {
    if (this.#items.length == 0) {
      display(`I'm not carrying anything right now.`);
    } else {
      if (this.#items.length == 1) {
        display(`I'm carrying ${this.#items[0].description}`);
      } else {
        display(
          `I'm carrying ${this.#items.length} things: ${this.#items.map(
            (item) => `\n - ${item.description}`
          )}`
        );
      }
    }
  }

  getFlag(name: string): boolean {
    return this.#flags.get(name) === true;
  }

  move(room: string): void {
    const r = this.findRoom(room);
    if (r) {
      this.#currentRoom = r;
    }
  }

  put(item: string, room: string | undefined): void {
    this.findItem(item)?.drop(room);
  }

  putWith(item1: string, item2: string): void {
    const i = this.findItem(item2);
    if (i) {
      this.findItem(item1)?.putWith(i);
    }
  }

  quit(): void {
    this.#running = false;
  }

  resetCounter(name: string): void {
    this.#counters.set(name, 0);
  }

  resetFlag(name: string): void {
    this.#flags.set(name, false);
  }

  setCounter(name: string, val: number): void {
    this.#counters.set(name, val);
  }

  setFlag(name: string, val: boolean): void {
    this.#flags.set(name, val);
  }

  setString(key: string, value: string): void {
    this.#strings.set(key, value);
  }

  swap(item1: string, item2: string): void {
    const i1 = this.findItem(item1);
    const i2 = this.findItem(item2);
    if (i1 && i2) {
      const r1 = i1.currentRoom;
      const r2 = i2.currentRoom;
      i1.drop(r2);
      i2.drop(r1);
    }
  }
}

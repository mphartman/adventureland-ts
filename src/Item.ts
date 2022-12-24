import { Room } from './Room';
import { Word } from './Vocabulary';

export class Item extends Word {
  #currentRoom?: string;

  constructor(
    readonly name: string,
    readonly description?: string,
    readonly portable: boolean = false,
    readonly startingRoom?: string,
    aliases?: string[]
  ) {
    super(name, aliases);
    if (!description) {
      this.description = name;
    }
    this.#currentRoom = startingRoom || Room.NOWHERE.name;
  }

  get currentRoom(): string | undefined {
    return this.#currentRoom;
  }

  isHere(room: Room): boolean {
    return this.#currentRoom === room.name;
  }

  isCarried(): boolean {
    return this.#currentRoom === Room.INVENTORY.name;
  }

  hasMoved(): boolean {
    return this.#currentRoom !== this.startingRoom;
  }

  drop(room: Room | string | undefined): string | undefined {
    const formerRoom = this.#currentRoom;
    this.#currentRoom = typeof room === 'string' ? room : room?.name;
    return formerRoom;
  }

  stow(): string | undefined {
    if (this.portable) {
      return this.drop(Room.INVENTORY);
    }
    throw new Error(`Cannot stow a non-portable item in player inventory`);
  }

  putWith(item: Item) {
    this.drop(item.currentRoom);
  }

  destroy() {
    this.drop(undefined);
  }

  isDestroyed(): boolean {
    return this.#currentRoom === undefined;
  }
}

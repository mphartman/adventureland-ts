import util from 'node:util';
import { Word } from './Word';

/**
 * Rooms make up a connected network of nodes between which the player may move.
 * A Room may have no more than one exit per direction but each exit may point to the same room.
 * E.g. A room can only have one North exit but the North and Up exits can both reference the same destination.
 */
export class Room {
  static NOWHERE: Room = new Room(
    'nowhere',
    "I am no where.  It's dark and I am alone."
  );

  static INVENTORY: Room = new Room('inventory', 'Inventory');

  readonly #exitsByDirection: Map<string, Exit> = new Map();

  constructor(
    readonly name: string,
    readonly description: string,
    exits: Exit[] = []
  ) {
    exits.forEach((exit) => this.#exitsByDirection.set(exit.direction, exit));
  }

  get exits(): readonly Exit[] {
    return Array.from(this.#exitsByDirection.values());
  }

  setExit(exit: Exit) {
    this.#exitsByDirection.set(exit.direction, exit);
  }

  hasExit(direction: Word | string | undefined): boolean {
    if (direction) {
      return this.#exitsByDirection.has(
        typeof direction === 'string' ? direction : direction.name
      );
    } else {
      return false;
    }
  }

  exit(direction: Word | string): string | undefined {
    return this.#exitsByDirection.get(
      typeof direction === 'string' ? direction : direction.name
    )?.room;
  }

  equals(that: Room): boolean {
    return util.isDeepStrictEqual(this, that);
  }
}

/**
 * An Exit is made up of a direction (e.g. North) and destination Room (i.e. where you end up after traveling in this Exit's direction).
 */
export class Exit {
  constructor(readonly direction: string, readonly room?: string) {}
}

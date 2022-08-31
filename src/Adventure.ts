import util from 'node:util';
import { Action } from './Action';

export class Adventure {
  constructor(
    readonly rooms?: readonly Room[],
    readonly items?: readonly Item[],
    readonly occurs?: Action[],
    readonly vocabulary?: Vocabulary
  ) {}
}

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

  hasExit(direction: Word): boolean {
    return this.#exitsByDirection.has(direction.name);
  }

  exit(direction: Word): string | undefined {
    return this.#exitsByDirection.get(direction.name)?.room;
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

export class Word {
  static UNRECGONIZED = new Word('<unrecognized>', [], false);
  static NONE = new Word('<none>');
  static ANY = new Word('<any>');

  static of(name: string | Word) {
    if (typeof name === 'string') {
      return new Word(name);
    } else {
      return name;
    }
  }

  static unrecognized(name?: string) {
    return name ? new Word(name, [], false) : Word.UNRECGONIZED;
  }

  readonly #_synonyms: readonly string[];

  constructor(
    readonly name: string,
    readonly synonyms: readonly string[] = [],
    readonly recognized: boolean = true
  ) {
    this.#_synonyms = [name.toUpperCase()].concat(
      synonyms.map((s) => s.toUpperCase())
    );
  }

  unrecognized() {
    return !this.recognized;
  }

  matches(that: Word): boolean {
    if (this === that) return true;
    if (this.name === that.name) return true;
    if (this.unrecognized() && that.unrecognized()) return true;
    if (this === Word.NONE && that == Word.NONE) return true;
    if (this === Word.NONE || that === Word.NONE) return false;
    if (this === Word.ANY || that === Word.ANY) return true;
    return (
      this.#_synonyms.filter((s) => that.#_synonyms.includes(s)).length > 0
    );
  }

  toString = (): string => {
    return this.name;
  };
}

export class Vocabulary {
  readonly words: readonly Word[];

  constructor(words: Word[]) {
    this.words = words.filter(
      (word) =>
        !(word.unrecognized() || word === Word.NONE || word === Word.ANY)
    );
  }

  findMatch(word: string | Word): Word | undefined {
    const wordToFind = Word.of(word);
    return this.words.find((w) => w.matches(wordToFind));
  }

  merge(vocabulary: Vocabulary): Vocabulary {
    const words = this.words.concat(vocabulary.words);
    return new Vocabulary(Array.from(words.values()));
  }
}

export class Item extends Word {
  private static INVENTORY = '#INVENTORY#';

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
    this.#currentRoom = startingRoom;
  }

  get currentRoom(): string | undefined {
    return this.#currentRoom;
  }

  isHere(room: Room): boolean {
    return this.#currentRoom === room.name;
  }

  isCarried(): boolean {
    return this.#currentRoom === Item.INVENTORY;
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
      return this.drop(Item.INVENTORY);
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

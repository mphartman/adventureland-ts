import util from 'node:util';

export class Adventure {
  constructor(
    public readonly rooms?: readonly Room[],
    public readonly items?: readonly Item[],
    public readonly vocabulary?: Vocabulary
  ) {}
}

/**
 * Rooms make up a connected network of nodes between which the player may move.
 * A Room may have no more than one exit per direction but each exit may point to the same room.
 * E.g. A room can only have one North exit but the North and Up exits can both reference the same destination.
 */
export class Room {
  public static NOWHERE: Room = new Room(
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

  public get exits(): readonly Exit[] {
    return Array.from(this.#exitsByDirection.values());
  }

  public setExit(exit: Exit) {
    this.#exitsByDirection.set(exit.direction, exit);
  }

  public hasExit(direction: Word): boolean {
    return this.#exitsByDirection.has(direction.name);
  }

  public exit(direction: Word): string | undefined {
    return this.#exitsByDirection.get(direction.name)?.room;
  }

  public equals(that: Room): boolean {
    return util.isDeepStrictEqual(this, that);
  }
}

/**
 * A RoomExit is made up of a direction (e.g. North) and destination Room (i.e. where you end up after traveling in this RoomExit's direction).
 */
export class Exit {
  constructor(readonly direction: string, readonly room?: string) {}
}

export class Word {
  public static UNRECGONIZED = new Word('<unrecognized>', [], false);
  public static NONE = new Word('<none>');
  public static ANY = new Word('<any>');

  public static of(name: string | Word) {
    if (typeof name === 'string') {
      return new Word(name);
    } else {
      return name;
    }
  }

  public static unrecognized(name?: string) {
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

  public unrecognized() {
    return !this.recognized;
  }

  public matches(that: Word): boolean {
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

  public toString = (): string => {
    return this.name;
  };
}

export class Vocabulary {
  public readonly words: readonly Word[];

  constructor(words: Word[]) {
    this.words = words.filter(
      (word) =>
        !(word.unrecognized() || word === Word.NONE || word === Word.ANY)
    );
  }

  public findMatch(word: string | Word): Word | undefined {
    const wordToFind = Word.of(word);
    return this.words.find((w) => w.matches(wordToFind));
  }

  public merge(vocabulary: Vocabulary): Vocabulary {
    const words = this.words.concat(vocabulary.words);
    return new Vocabulary(Array.from(words.values()));
  }
}

export class Item extends Word {
  private static INVENTORY = '#INVENTORY#';

  #currentRoom?: string;

  constructor(
    public readonly name: string,
    public readonly description?: string,
    public readonly portable: boolean = false,
    public readonly startingRoom?: string,
    aliases?: string[]
  ) {
    super(name, aliases);
    if (!description) {
      this.description = name;
    }
    this.#currentRoom = startingRoom;
  }

  public get currentRoom(): string | undefined {
    return this.#currentRoom;
  }

  public isHere(room: Room): boolean {
    return this.#currentRoom === room.name;
  }

  public isCarried(): boolean {
    return this.#currentRoom === Item.INVENTORY;
  }

  public hasMoved(): boolean {
    return this.#currentRoom !== this.startingRoom;
  }

  public drop(room: Room | string | undefined): string | undefined {
    const formerRoom = this.#currentRoom;
    this.#currentRoom = typeof room === 'string' ? room : room?.name;
    return formerRoom;
  }

  public stow(): string | undefined {
    if (this.portable) {
      return this.drop(Item.INVENTORY);
    }
    throw new Error(`Cannot stow a non-portable item in player inventory`);
  }

  public putWith(item: Item) {
    this.drop(item.currentRoom);
  }

  public destroy() {
    this.drop(undefined);
  }

  public isDestroyed(): boolean {
    return this.#currentRoom === undefined;
  }
}

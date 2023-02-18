export class Word {
  static UNRECOGNIZED = new Word('<unrecognized>', [], false);
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
    return name ? new Word(name, [], false) : Word.UNRECOGNIZED;
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

  unrecognized(): boolean {
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

  toString(): string {
    return this.name;
  }
}

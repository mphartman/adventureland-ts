import { Set } from 'immutable';

export interface Adventure {}

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

  private readonly _synonyms: readonly string[];

  constructor(
    readonly name: string,
    readonly synonyms: readonly string[] = [],
    readonly recognized: boolean = true
  ) {
    this._synonyms = [name.toUpperCase()].concat(
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
    return this._synonyms.filter((s) => that._synonyms.includes(s)).length > 0;
  }

  public toString = () : string => {
    return this.name
  }
}

export class Vocabulary {
  private readonly _words: Set<Word>;

  constructor(words: Word[]) {
    this._words = Set<Word>(
      words.filter(
        (word) =>
          !(word.unrecognized() || word === Word.NONE || word === Word.ANY)
      )
    );
  }

  public findMatch(word: string | Word): Word | undefined {
    const wordToFind = Word.of(word);
    return this._words.find((w) => w.matches(wordToFind));
  }

  public merge(vocabulary: Vocabulary): Vocabulary {
    const words = this._words.concat(vocabulary._words);
    return new Vocabulary(Array.from(words.values()));
  }
}

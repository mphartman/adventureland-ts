import { Word } from './Word';

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

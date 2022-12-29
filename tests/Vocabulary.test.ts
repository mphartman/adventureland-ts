import { Vocabulary } from '../src/Vocabulary';
import { Word } from '../src/Word';

describe('Word', () => {
  it('should match Word with same name', () => {
    const w = Word.of('foo');
    expect(w.matches(Word.of('foo'))).toBeTruthy();
  });

  it('should match Word with synonyms', () => {
    const w = new Word('bar', ['b']);
    expect(w.matches(Word.of('b'))).toBeTruthy();
    expect(w.matches(new Word('bbaarr', ['bar']))).toBeTruthy();
  });

  it('should match when both Words are unrecognized', () => {
    const w = Word.unrecognized('foo');
    expect(w.matches(Word.unrecognized('bar'))).toBeTruthy();
    expect(w.matches(new Word('poo', [], false))).toBeTruthy();
  });

  it('should match when both Words are NONE', () => {
    expect(Word.NONE.matches(Word.NONE)).toBeTruthy();
  });

  it('should not match when either Word is NONE', () => {
    expect(Word.of('shark').matches(Word.NONE)).toBeFalsy();
    expect(Word.NONE.matches(Word.of('seal'))).toBeFalsy();
  });

  it('should match when either Word is ANY', () => {
    expect(Word.of('crab').matches(Word.ANY)).toBeTruthy();
  });
});

describe('Vocabulary', () => {
  it('should find a match for a word it contains', () => {
    const v = new Vocabulary([Word.unrecognized('john'), Word.of('bear')]);
    expect(v.findMatch(Word.of('bear'))).toBeTruthy();
    expect(v.findMatch(Word.of('cat'))).toBeFalsy();
    expect(v.findMatch(Word.unrecognized('john'))).toBeFalsy();
  });

  it('should not contain unrecognized, ANY or NONE words', () => {
    const v = new Vocabulary([
      Word.NONE,
      Word.ANY,
      Word.UNRECOGNIZED,
      Word.unrecognized('baz'),
    ]);
    expect(v.findMatch(Word.ANY)).toBeFalsy();
    expect(v.findMatch(Word.NONE)).toBeFalsy();
    expect(v.findMatch(Word.UNRECOGNIZED)).toBeFalsy();
    expect(v.findMatch(Word.unrecognized('baz'))).toBeFalsy();
    expect(v.findMatch(Word.of('car'))).toBeFalsy();
  });

  it('should merge to create a new Vocabulary containing words from both', () => {
    const v = new Vocabulary([Word.of('one'), Word.of('two')]);
    const merged = v.merge(new Vocabulary([Word.of('three')]));
    expect(merged.findMatch(Word.of('three'))).toBeTruthy();
    expect(merged.findMatch(Word.of('two'))).toBeTruthy();
    expect(merged.findMatch(Word.of('one'))).toBeTruthy();
  });
});

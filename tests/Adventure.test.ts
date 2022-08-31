import { Room, Exit, Vocabulary, Word, Item } from '../src/Adventure';

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
      Word.UNRECGONIZED,
      Word.unrecognized('baz'),
    ]);
    expect(v.findMatch(Word.ANY)).toBeFalsy();
    expect(v.findMatch(Word.NONE)).toBeFalsy();
    expect(v.findMatch(Word.UNRECGONIZED)).toBeFalsy();
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

describe('Room', () => {
  it('should have name and description', () => {
    const r = new Room('den', "Mike's den", []);
    expect(r.name).toBe('den');
    expect(r.description).toBe("Mike's den");
  });

  it('should have exits', () => {
    const r = new Room('forest', 'a lush, green forest', [
      new Exit('north', 'beach'),
    ]);
    expect(r.exits.length).toBe(1);
    expect(r.exits[0]).toStrictEqual(new Exit('north', 'beach'));
    expect(r.hasExit(Word.of('north'))).toBeTruthy();
    expect(r.hasExit(Word.of('south'))).toBeFalsy();
  });

  it('should have unique exits by direction', () => {
    const r = new Room('forest', 'a lush, green forest', [
      new Exit('north', 'beach'),
    ]);
    r.setExit(new Exit('north', 'river'));
    expect(r.exits[0]).toStrictEqual(new Exit('north', 'river'));
  });
});

describe('Item', () => {
  it('should default description to name', () => {
    const i = new Item('axe');
    expect(i.description).toBe('axe');
  });

  it('should default starting rooom to NOWHERE', () => {
    const i = new Item('hairbrush');
    expect(i.startingRoom === undefined).toBeTruthy();
  });

  it('should default current room to starting room', () => {
    const i = new Item('axe', 'sharp handaxe', true, 'lumberyard');
    expect(i.currentRoom).toBe('lumberyard');
  });

  it('should be in its current room', () => {
    const i = new Item('chair', 'patio chair', false, 'patio');
    expect(i.isHere(new Room('patio', 'walk-out patio'))).toBeTruthy();
    expect(i.isHere(new Room('garage', 'place for cars'))).toBeFalsy();
  });

  it('should stow item in player inventory', () => {
    const i = new Item('rope', '50 ft. of silk rope', true);
    expect(i.isCarried()).toBeFalsy();
    i.stow();
    expect(i.isCarried()).toBeTruthy();
  });

  it('should drop item in room', () => {
    const i = new Item('can');
    const room = new Room('recycle-bin', 'save mother earth');
    expect(i.isHere(room)).toBeFalsy();

    i.drop(room);
    expect(i.isHere(room)).toBeTruthy();
  });

  it('should put item in same room as another item', () => {
    const lunchBag = new Item(
      'lunch-bag',
      'peanut butter and jelly sandwich and chips',
      true,
      'backpack'
    );
    const trapperKeeper = new Item('trapper-keeper');
    trapperKeeper.putWith(lunchBag);
    expect(
      trapperKeeper.isHere(
        new Room('backpack', 'canvas bag with shoulder straps')
      )
    ).toBeTruthy();
  });

  it('should destroy item', () => {
    const ringOfPower = new Item(
      'ring',
      'one ring to rule them all',
      true,
      'frodo-finger'
    );
    expect(ringOfPower.isDestroyed()).toBeFalsy();
    ringOfPower.destroy();
    expect(ringOfPower.isDestroyed()).toBeTruthy();
  });
});

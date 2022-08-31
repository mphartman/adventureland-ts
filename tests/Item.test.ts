import { Item } from '../src/Item';
import { Room } from '../src/Room';

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

import { Exit, Room } from '../src/Room';
import { Word } from '../src/Word';

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

  it('should return room given a valid exit', () => {
    const kitchen = new Room(
      'kitchen',
      'modern kitchen with granite countertops',
      [new Exit('left', 'dining-room')]
    );
    const diningRoom = new Room(
      'dining-room',
      'spacious table with room to seat eight',
      [new Exit('right', 'kitchen')]
    );

    expect(kitchen.hasExit(Word.of('left'))).toBeTruthy();
    expect(diningRoom.hasExit(Word.of('right'))).toBeTruthy();
    expect(kitchen.exit(Word.of('left'))).toEqual('dining-room');
    expect(diningRoom.exit(Word.of('right'))).toEqual('kitchen');
  });
});

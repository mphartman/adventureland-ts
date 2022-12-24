import 'jest-extended';
import fs from 'fs';
import path from 'path';
import { AdventureScriptParser } from '../src/AdventureScriptParser';
import { Adventure } from '../src/Adventure';
import { Exit, Room } from '../src/Room';
import { Word } from '../src/Vocabulary';
import { Action, GameState } from '../src/Action';
import { Condition } from '../src/Condition';
import { Result } from '../src/Result';

describe('AdventureScriptParser', () => {
  describe('Rooms', () => {
    test('empty script throws error', () => {
      expect(() => parse('000adventure.txt')).toThrow(
        /mismatched input '<EOF>'/
      );
    });

    test('room missing description throws error', () => {
      expect(() => parse('001adventure.txt')).toThrow(/missing StringLiteral/);
    });

    test('room missing name throws error', () => {
      expect(() => parse('002adventure.txt')).toThrow(/missing Identifier/);
    });

    test('valid rooms', () => {
      const adventure = parse('003adventure.txt');
      expect(adventure.rooms).toHaveLength(10);
    });

    test('single room with zero exits', () => {
      const adventure = parse('010adventure.txt');
      expect(adventure.rooms).toHaveLength(1);
      expect(adventure.rooms?.[0]).toEqual<Room>(
        new Room('bedroom', 'A small room with a "large" bed')
      );
    });

    test('two rooms with shared exits', () => {
      const adventure = parse('020adventure.txt');
      expect(adventure.rooms).toHaveLength(2);
      expect(adventure.rooms?.[0].exits).toHaveLength(1);
      expect(adventure.rooms?.[1].exits).toHaveLength(2);
      expect(adventure.rooms?.[0].exits[0]).toEqual<Exit>({
        direction: 'north',
        room: 'hallway',
      });
      expect(adventure.rooms?.[1].exits[0]).toEqual<Exit>({
        direction: 'south',
        room: adventure.rooms?.[0].name,
      });
      expect(adventure.rooms?.[1].exits[1]).toEqual<Exit>({
        direction: 'north',
        room: adventure.rooms?.[1].name,
      });
    });

    test('exit without room takes you back to same room', () => {
      const adventure = parse('030adventure.txt');
      expect(adventure.rooms?.[0].exit(Word.of('foobar'))).toEqual(
        adventure.rooms?.[0].name
      );
    });

    test('bad exit to non-existent room throws error', () => {
      expect(() => parse('040adventure.txt')).toThrow(
        /exit 'north' of room 'bedroom' references a non-existing room 'iDoNotExist'/
      );
    });

    test('with duplicate exits, last one wins', () => {
      const adventure = parse('060adventure.txt');
      expect(adventure.rooms?.[0].exit('north')).toBe('swamp');
    });

    test('start set to correct room', () => {
      const adventure = parse('070adventure.txt');
      expect(adventure.start).toBe('meadow');
      expect(adventure.rooms).toContainEqual({
        description: "I'm in a beautiful meadow.",
        name: 'meadow',
      });
    });
  });

  describe('Actions', () => {
    test('missing verb and result throws error', () => {
      expect(() => parse('300adventure.txt')).toThrow(
        "mismatched input '<EOF>' expecting {'(', 'any', 'none', UNKNOWN, Identifier, StringLiteral}"
      );
    });

    test('missing result throws error', () => {
      expect(() => parse('301adventure.txt')).toThrow(
        "mismatched input '<EOF>' expecting {'when', 'and', 'then'}"
      );
    });

    test('verb and result', () => {
      const adventure = parse('302adventure.txt');
      expect(adventure.actions).toHaveLength(1);
      const action = adventure.actions?.[0] as Action;
      expect(action.conditions).toHaveLength(1);
      expect(action.results).toHaveLength(1);
      const condition = action.conditions?.[0] as Condition;
      expect(condition([Word.of('print')], {} as GameState)).toBeTruthy();
      const result = action.results?.[0] as Result;
      const display = jest.fn();
      result([], {} as GameState, display);
      expect(display).toHaveBeenCalledWith('It works');
    });
  });

  describe('Items', () => {
    test('item missing description throws', () => {
      expect(() => parse('100adventure.txt')).toThrow(
        "missing StringLiteral at '<EOF>'"
      );
    });

    test('item without name is invalid syntax', () => {
      expect(() => parse('101adventure.txt')).toThrow(
        "missing Identifier at 'A brass key'"
      );
    });

    test('valid item', () => {
      const adventure = parse('102adventure.txt');
      const items = adventure.items;
      expect(items).toHaveLength(1);
      expect(items).toContainEqual({
        description: 'A brass key',
        name: 'key',
        portable: false,
        recognized: true,
        startingRoom: undefined,
        synonyms: [],
      });
    });

    test('valid item with aliases', () => {
      const adventure = parse('103adventure.txt');
      expect(adventure.items).toContainEqual({
        description: 'A greatsword',
        name: 'sword',
        portable: true,
        startingRoom: Room.NOWHERE.name,
        recognized: true,
        synonyms: expect.arrayContaining([
          'excalibur',
          'nightblade',
          'sharpie',
        ]),
      });
    });

    test('items in valid locations', () => {
      const adventure = parse('104adventure.txt');
      const items = adventure.items;
      expect(items).toContainItemInRoom('fork', 'kitchen');
      expect(items).toContainItemInRoom('chest', 'hallway');
      expect(items).toContainItemInRoom('spoon', 'kitchen');
      expect(items).toContainItemInRoom('knife', Room.NOWHERE);
      expect(items).toContainItemInRoom('flint', Room.INVENTORY);
    });
  });
});

function parse(scriptName: string): Adventure {
  return new AdventureScriptParser().parse(script(scriptName));
}

function script(name: string): string {
  return fs.readFileSync(path.resolve(__dirname, 'scripts', name), 'utf-8');
}

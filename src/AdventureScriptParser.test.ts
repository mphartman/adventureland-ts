import fs from 'fs';
import 'jest-extended';
import { mock } from 'jest-mock-extended';
import path from 'path';
import { Action } from './Action';
import { Adventure } from './Adventure';
import { AdventureScriptParser } from './AdventureScriptParser';
import { Condition } from './Condition';
import { GameState } from './GameState';
import { Result } from './Result';
import { Exit, Room } from './Room';
import { Word } from './Word';

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
      expect(adventure.startingRoom).toEqual({
        description: "I'm in a beautiful meadow.",
        name: 'meadow',
      });
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

    test('verb and print result', () => {
      const adventure = parse('302adventure.txt');
      expect(adventure.actions).toHaveLength(1);
      const action = adventure.actions?.[0] as Action;
      expect(action.conditions).toHaveLength(1);
      expect(action.results).toHaveLength(1);
      const condition = action.conditions?.[0] as Condition;
      expect(condition([Word.of('print')], {} as GameState)).toBeTruthy();
      const result = action.results?.[0] as Result;
      const gameState = mock<GameState>();
      const display = jest.fn();
      result([], gameState, display);
      expect(gameState.print).toHaveBeenCalledWith(display, 'It works');
    });

    test('verb and look result', () => {
      const adventure = parse('303adventure.txt');
      const action = adventure.actions?.[0] as Action;
      const gameState = mock<GameState>();
      const display = jest.fn();
      action.run([Word.of('look')], gameState, display);
      expect(gameState.describe).toHaveBeenCalledWith(display);
    });

    test('verb and go result', () => {
      const adventure = parse('304adventure.txt');
      const action = adventure.actions?.[0] as Action;
      const gameState = mock<GameState>();
      const display = jest.fn();
      action.run([Word.of('flee'), Word.of('north')], gameState, display);
      expect(gameState.exitTowards).toHaveBeenCalledWith('north');
    });

    test('verb and quit result', () => {
      const adventure = parse('305adventure.txt');
      const action = adventure.actions?.[0] as Action;
      const gameState = mock<GameState>();
      const display = jest.fn();
      action.run([Word.of('quit')], gameState, display);
      expect(gameState.quit).toHaveBeenCalled();
    });

    test('action with verb list', () => {
      const adventure = parse('306adventure.txt');
      const action = adventure.actions?.[0] as Action;
      const gameState = mock<GameState>();
      const display = jest.fn();
      action.run([Word.of('first')], gameState, display);
      expect(gameState.print).toHaveBeenCalledWith(display, 'matched');
      jest.resetAllMocks();
      action.run([Word.of('not')], gameState, display);
      expect(display).not.toHaveBeenCalled();
      jest.resetAllMocks();
      action.run([Word.of('second')], gameState, display);
      expect(gameState.print).toHaveBeenCalledWith(display, 'matched');
      jest.resetAllMocks();
      action.run([Word.of('third')], gameState, display);
      expect(gameState.print).toHaveBeenCalledWith(display, 'matched');
    });

    test('action with required first word and verb list', () => {
      const adventure = parse('307adventure.txt');
      const action = adventure.actions?.[0] as Action;
      const gameState = mock<GameState>();
      const display = jest.fn();
      action.run([Word.of('first')], gameState, display);
      expect(gameState.print).not.toHaveBeenCalled();
      jest.resetAllMocks();
      action.run([Word.of('first'), Word.of('one')], gameState, display);
      expect(gameState.print).toHaveBeenCalledWith(display, 'matched!');
      jest.resetAllMocks();
      action.run([Word.of('first'), Word.of('two')], gameState, display);
      expect(gameState.print).toHaveBeenCalledWith(display, 'matched!');
      jest.resetAllMocks();
      action.run([Word.of('first'), Word.of('three')], gameState, display);
      expect(gameState.print).toHaveBeenCalledWith(display, 'matched!');
      jest.resetAllMocks();
      action.run([Word.of('first'), Word.of('four')], gameState, display);
      expect(gameState.print).not.toHaveBeenCalled();
    });

    test('action two word groups', () => {
      const adventure = parse('308adventure.txt');
      const action = adventure.actions?.[0] as Action;
      const gameState = mock<GameState>();
      const display = jest.fn();
      action.run([Word.of('first'), Word.of('one')], gameState, display);
      expect(gameState.print).toHaveBeenCalledWith(display, 'matched!');
      jest.resetAllMocks();
      action.run([Word.of('first'), Word.of('two')], gameState, display);
      expect(gameState.print).toHaveBeenCalledWith(display, 'matched!');
      jest.resetAllMocks();
      action.run([Word.of('second'), Word.of('one')], gameState, display);
      expect(gameState.print).toHaveBeenCalledWith(display, 'matched!');
      jest.resetAllMocks();
      action.run([Word.of('first'), Word.of('two')], gameState, display);
      expect(gameState.print).toHaveBeenCalledWith(display, 'matched!');
      jest.resetAllMocks();
      action.run([Word.of('nope'), Word.of('one')], gameState, display);
      expect(gameState.print).not.toHaveBeenCalled();
      jest.resetAllMocks();
    });

    test('verb with swap result', () => {
      const adventure = parse('309adventure.txt');
      const action = adventure.actions?.[0] as Action;
      const gameState = mock<GameState>();
      const display = jest.fn();
      action.run([Word.of('unlock'), Word.of('door')], gameState, display);
      expect(gameState.swap).toHaveBeenCalledWith('locked_door', 'open_door');
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

    test('items in invalid location throws', () => {
      expect(() => parse('105adventure.txt')).toThrow();
    });
  });
});

function parse(scriptName: string): Adventure {
  return new AdventureScriptParser().parse(script(scriptName));
}

function script(name: string): string {
  return fs.readFileSync(
    path.resolve(__dirname, '..', 'scripts', name),
    'utf-8'
  );
}

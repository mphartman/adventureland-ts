import { AdventureScriptParser } from '../src/AdventureScriptParser';
import fs from 'fs';
import path from 'path';
import { Adventure, Exit, Room, Word } from '../src/Adventure';

describe('AdventureScriptParser', () => {
  test('empty script throws error', () => {
    expect(() => parse('000adventure.txt')).toThrow(/mismatched input '<EOF>'/);
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
});

function parse(scriptName: string): Adventure {
  return new AdventureScriptParser().parse(script(scriptName));
}

function script(name: string): string {
  return fs.readFileSync(path.resolve(__dirname, 'scripts', name), 'utf-8');
}
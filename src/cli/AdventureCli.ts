import path from 'path';
import fs from 'fs';
import { AdventureScriptParser } from '../AdventureScriptParser';
import { Adventure } from '../Adventure';
import { DefaultGameState } from '../GameState';
import { Game } from '../Game';
import { Controller } from '../Controller';
import { Word } from '../Word';
import { Display } from '../Display';
import readline from 'readline-sync';

function parse(text: string): Adventure {
  return new AdventureScriptParser().parse(text);
}

function read(scriptPath: string): string {
  return fs.readFileSync(path.resolve(scriptPath), 'utf-8');
}

const prompt: Controller = () => readline.promptCL().map((c) => Word.of(c));

const consoleDisplay: Display = console.log;

(async () => {
  const adventure = parse(
    read(path.join(__dirname, '..', '..', 'docs', 'example_adventure_1.txt'))
  );
  const gameState = new DefaultGameState(
    adventure.startingRoom,
    adventure.items,
    adventure.rooms
  );
  const game = new Game(adventure, gameState, prompt, consoleDisplay);
  game.run();
})();

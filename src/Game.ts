import { Adventure } from './Adventure';
import { GameState } from './GameState';
import { Display } from './Display';
import { Command } from './Action';
import { Controller } from './Controller';

export class Game {
  constructor(
    readonly adventure: Adventure,
    readonly gameState: GameState,
    readonly prompt: Controller,
    readonly display: Display
  ) {}

  run(): void {
    this.runOccurs();
    while (this.gameState.running) {
      this.takeTurn(this.prompt());
    }
  }

  private takeTurn(command: Command) {
    this.runActions(command);
    this.runOccurs();
  }

  private runActions(command: Command) {
    for (const action of this.adventure.actions) {
      if (action.run(command, this.gameState, this.display)) {
        return;
      }
    }
  }

  private runOccurs() {
    this.adventure.occurs.forEach((occur) =>
      occur.run([], this.gameState, this.display)
    );
  }
}

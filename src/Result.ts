import { Command, Display, GameState } from './Action';

export type Result = (
  command: Command,
  state: GameState,
  display: Display
) => void;

export function print(message: string | undefined): Result {
  return (command, state, display) => display(message);
}

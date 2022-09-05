import { Action } from './Action';
import { Item } from './Item';
import { Room } from './Room';
import { Vocabulary } from './Vocabulary';

export class Adventure {
  constructor(
    readonly rooms: readonly Room[],
    readonly vocabulary: Vocabulary,
    readonly actions?: Action[],
    readonly items?: readonly Item[],
    readonly occurs?: Action[],
    readonly start?: string
  ) {}
}

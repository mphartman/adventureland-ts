import { Action } from './Action';
import { Item } from './Item';
import { Room } from './Room';
import { Vocabulary } from './Vocabulary';

export class Adventure {
  constructor(
    readonly rooms?: readonly Room[],
    readonly items?: readonly Item[],
    readonly occurs?: Action[],
    readonly vocabulary?: Vocabulary
  ) {}
}

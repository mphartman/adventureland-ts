import { Action } from './Action';
import { Item } from './Item';
import { Room } from './Room';
import { Vocabulary } from './Vocabulary';

export class Adventure {
  constructor(
    readonly vocabulary: Vocabulary = new Vocabulary([]),
    readonly rooms: Room[] = [],
    readonly startingRoom: Room = Room.NOWHERE,
    readonly items: Item[] = [],
    readonly actions: Action[] = [],
    readonly occurs: Action[] = []
  ) {}
}

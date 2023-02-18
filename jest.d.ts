import * as expect from 'expect';
import { Room } from './src/Room';

declare global {
  namespace jest {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface Matchers<R, T> {
      // Note that we are defining a public call signature
      // for our matcher here (how it will be used):
      toContainItemInRoom(itemName: string, roomName: string | Room): T;
    }
    interface ExpectExtendMap {
      // Here, we're describing the call signature of our
      // matcher for the "expect.extend()" call.
      toContainItemInRoom: expect.MatcherFunction<
        [itemName: string, roomName: string | Room]
      >;
    }
  }
}

export {};

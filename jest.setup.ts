// jest.setup.ts

expect.extend({
  toContainItemInRoom(actual, itemName, room) {
    if (!Array.isArray(actual)) {
      throw new Error('Actual value must be an array');
    }
    const roomName = typeof room === 'string' ? room : room.name;
    const item = actual.find((i) => i.name === itemName);
    const pass = item?.currentRoom === roomName;
    return {
      pass,
      message: pass
        ? () =>
            `expected ${itemName} not to be within ${roomName} but was in ${item?.currentRoom}`
        : () =>
            `expected ${itemName} to be in ${roomName} but was in ${item?.currentRoom}`,
    };
  },
});

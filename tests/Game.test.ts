import { main } from '../src/Game';

test.skip('print hello to console', () => {
  jest.spyOn(global.console, 'log');
  main();
  expect(console.log).toHaveBeenCalledWith('hello');
});

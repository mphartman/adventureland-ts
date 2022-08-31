import { AdventureScriptParser } from './AdventureScriptParser';
import fs from 'fs';
import path from 'path';

export const main = () => {
  const text = fs.readFileSync(
    path.join(__dirname, '../', 'sample-adventure.txt'),
    'utf-8'
  );
  const parser = new AdventureScriptParser();
  const adventure = parser.parse(text);
  console.log(JSON.stringify(adventure, null, 2));
};

main();

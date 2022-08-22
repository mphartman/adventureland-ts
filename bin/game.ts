import { AdventureScriptParser } from "../src/AdventureScriptParser";
import fs from 'fs';
import path from 'path';

export const main = () => {
    console.log('game starting');
    const text = fs.readFileSync(path.join(__dirname, '../', 'sample-adventure.txt'), 'utf-8');
    const adventure = new AdventureScriptParser(text);
    console.log('hello');
}

main();

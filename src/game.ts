import { AdventureScriptParser } from "./AdventureScriptParser";
import fs from 'fs';
import path from 'path';

export const main = () => {
    console.log('game starting');
    const text = fs.readFileSync(path.join(__dirname, '../', 'sample-adventure.txt'), 'utf-8');
    new AdventureScriptParser(text);
}

main();

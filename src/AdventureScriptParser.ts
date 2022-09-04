import { CharStreams, CommonTokenStream } from 'antlr4ts';
import { AbstractParseTreeVisitor } from 'antlr4ts/tree/AbstractParseTreeVisitor';
import { AdventureLexer } from '../generated/grammar/AdventureLexer';
import {
  ActionConditionDeclarationContext,
  ActionDeclarationContext,
  ActionWordAnyContext,
  ActionWordDirectionContext,
  ActionWordNoneContext,
  ActionWordUnknownContext,
  ActionWordWordContext,
  AdventureContext,
  AdventureParser,
  ConditionInRoomContext,
  ItemDeclarationContext,
  ItemInRoomContext,
  ItemIsInInventoryContext,
  ItemIsNowhereContext,
  OccursDeclarationContext,
  ResultPrintContext,
  RoomDeclarationContext,
  RoomExitContext,
  WordGroupContext,
} from '../generated/grammar/AdventureParser';
import { AdventureVisitor } from '../generated/grammar/AdventureVisitor';
import { Adventure } from './Adventure';
import { Action } from './Action';
import {
  Condition,
  inRoom,
  not,
  random,
  wordMatches,
  wordMatchesAny,
} from './Condition';
import { Result, print } from './Result';
import { Exit, Room } from './Room';
import { Item } from './Item';
import { Vocabulary, Word } from './Vocabulary';

function rooms(ctx: AdventureContext): Room[] {
  const visitor = new RoomDeclarationVisitor();
  return ctx
    .gameElement()
    .map((context) => context.roomDeclaration()?.accept(visitor))
    .filter((room) => room) as Room[];
}

function checkExits(rooms: Room[]): Room[] {
  const names = rooms.map((room) => room.name);
  for (const room of rooms) {
    for (const exit of room.exits) {
      const found = names.find((name) => name === exit.room);
      if (!found) {
        throw new Error(
          `exit '${exit.direction}' of room '${room.name}' references a non-existing room '${exit.room}'`
        );
      }
    }
  }
  return rooms;
}

function items(adventureContext: AdventureContext): Item[] {
  const visitor = new ItemVisitor();
  return adventureContext
    .gameElement()
    .map((context) => context.itemDeclaration()?.accept(visitor))
    .filter((item) => item) as Item[];
}

function vocabulary(adventureContext: AdventureContext): Vocabulary {
  const visitor = new VocabularyDeclarationVisitor();
  const words = adventureContext
    .gameElement()
    .map((context) => context.vocabularyDeclaration()?.accept(visitor))
    .filter((word) => word) as Word[];
  return new Vocabulary(words);
}

function occurs(adventureContext: AdventureContext): Action[] {
  const visitor = new OccursDeclarationVisitor();
  return adventureContext
    .gameElement()
    .map((context) => context.occursDeclaration()?.accept(visitor))
    .filter((occurs) => occurs) as Action[];
}

function actions(adventureContext: AdventureContext): Action[] {
  const visitor = new ActionsDeclarationVisitor();
  return adventureContext
    .gameElement()
    .map((context) => context.actionDeclaration()?.accept(visitor))
    .filter((action) => action) as Action[];
}

export class AdventureScriptParser {
  parse(adventureScriptText: string): Adventure {
    const inputStream = CharStreams.fromString(adventureScriptText);
    const lexer = new AdventureLexer(inputStream);
    const parser = new AdventureParser(new CommonTokenStream(lexer));
    parser.removeErrorListeners();
    parser.addErrorListener({
      syntaxError(
        recognizer,
        offendingSymbol,
        line,
        charPositionInLine,
        msg,
        e
      ): void {
        throw new Error(msg);
      },
    });
    return new RealAdventureVisitor().visitAdventure(parser.adventure());
  }
}

class RealAdventureVisitor
  extends AbstractParseTreeVisitor<Adventure>
  implements AdventureVisitor<Adventure>
{
  defaultResult() {
    return {};
  }

  visitAdventure(ctx: AdventureContext): Adventure {
    return {
      rooms: checkExits(rooms(ctx)),
      items: items(ctx),
      occurs: occurs(ctx),
      actions: actions(ctx),
      vocabulary: vocabulary(ctx),
    };
  }
}

class RoomDeclarationVisitor
  extends AbstractParseTreeVisitor<Room>
  implements AdventureVisitor<Room>
{
  defaultResult() {
    return Room.NOWHERE;
  }

  visitRoomDeclaration(ctx: RoomDeclarationContext): Room {
    const roomName = ctx.roomName().text;
    const roomExitVisitor = new RoomExitVisitor();
    const exits = ctx
      .roomExits()
      ?.roomExit()
      .map((context) => context.accept(roomExitVisitor))
      .map((exit) => {
        // reference this room for exits with no other room reference
        if (!exit.room) {
          return { ...exit, room: roomName };
        }
        return exit;
      });
    return new Room(roomName, ctx.roomDescription().text, exits);
  }
}

class RoomExitVisitor
  extends AbstractParseTreeVisitor<Exit>
  implements AdventureVisitor<Exit>
{
  defaultResult() {
    return { direction: '' };
  }

  visitRoomExit(ctx: RoomExitContext): Exit {
    return {
      direction: ctx.exitDirection().text,
      room: ctx.roomName()?.text,
    };
  }
}

class VocabularyDeclarationVisitor
  extends AbstractParseTreeVisitor<Word>
  implements AdventureVisitor<Word>
{
  defaultResult() {
    return Word.UNRECGONIZED;
  }

  visitWordGroup(ctx: WordGroupContext) {
    const name = ctx.word().text;
    const synonyms = Array.from(ctx.synonym()?.map((s) => s.text));
    return new Word(name, synonyms);
  }
}

class ItemVisitor
  extends AbstractParseTreeVisitor<Item>
  implements AdventureVisitor<Item>
{
  defaultResult() {
    return new Item('');
  }

  visitItemDeclaration(ctx: ItemDeclarationContext) {
    const name = ctx.itemName().text;
    const description = ctx.itemDescription().text;
    const location = ctx.itemLocation()?.accept(new ItemLocationVisitor());
    const aliases = ctx
      .itemAliases()
      ?.itemAlias()
      .map((context) => context.text);
    const portable = (aliases && aliases.length > 0) || location?.inventory;
    return new Item(name, description, portable, location?.room, aliases);
  }
}

type ItemLocation = {
  readonly room?: string;
  readonly inventory?: boolean;
  readonly nowhere?: boolean;
};

class ItemLocationVisitor
  extends AbstractParseTreeVisitor<ItemLocation>
  implements AdventureVisitor<ItemLocation>
{
  defaultResult(): ItemLocation {
    return {};
  }

  visitItemInRoom(ctx: ItemInRoomContext) {
    return { room: ctx.roomName().text };
  }

  visitItemIsInInventory(ctx: ItemIsInInventoryContext) {
    return { inventory: true };
  }

  visitItemIsNowhere(ctx: ItemIsNowhereContext) {
    return { nowhere: true };
  }
}

class OccursDeclarationVisitor
  extends AbstractParseTreeVisitor<Action>
  implements AdventureVisitor<Action>
{
  defaultResult(): Action {
    return new Action([], []);
  }

  visitOccursDeclaration(ctx: OccursDeclarationContext) {
    return new Action(this.conditions(ctx), this.results(ctx));
  }

  conditions(ctx: OccursDeclarationContext): Condition[] {
    const visitor = new ActionConditionDeclarationVisitor();
    const conditions = ctx
      .actionConditionDeclaration()
      .map((context) => context.accept(visitor));

    const number = ctx.Number();
    if (number && !Number.isNaN(number.text)) {
      conditions.push(random(Number.parseInt(number.text)));
    }

    return conditions;
  }

  results(ctx: OccursDeclarationContext): Result[] {
    const visitor = new ActionResultDeclarationVisitor();
    return ctx
      .actionResultDeclaration()
      .map((context) => context.accept(visitor));
  }
}

class ActionConditionDeclarationVisitor
  extends AbstractParseTreeVisitor<Condition>
  implements AdventureVisitor<Condition>
{
  defaultResult(): Condition {
    return (command, state) => false;
  }

  visitActionConditionDeclaration(
    ctx: ActionConditionDeclarationContext
  ): Condition {
    const condition = super.visitChildren(ctx);
    if (ctx.NOT()) {
      return not(condition);
    }
    return condition;
  }

  visitConditionInRoom(ctx: ConditionInRoomContext): Condition {
    return inRoom(ctx.roomName().text);
  }
}

class ActionResultDeclarationVisitor
  extends AbstractParseTreeVisitor<Result>
  implements AdventureVisitor<Result>
{
  defaultResult(): Result {
    return (command, state, display) => false;
  }

  visitResultPrint(ctx: ResultPrintContext): Result {
    return print(ctx._message.text);
  }
}

class ActionsDeclarationVisitor
  extends AbstractParseTreeVisitor<Action>
  implements AdventureVisitor<Action>
{
  defaultResult(): Action {
    return new Action([], []);
  }

  visitActionDeclaration(ctx: ActionDeclarationContext): Action {
    const conditions = this.command(ctx).concat(this.conditions(ctx));
    return new Action(conditions, this.results(ctx));
  }

  command(ctx: ActionDeclarationContext): Condition[] {
    const words: Word[] = [];
    let pos = 1;
    const conditions: Condition[] = [];
    const visitor = new ActionWordVisitor();
    for (const actionWordOrList of ctx.actionCommand().actionWordOrList()) {
      const actionWord = actionWordOrList.actionWord();
      if (actionWord) {
        const word = actionWord.accept(visitor);
        words.push(word);
        conditions.push(wordMatches(pos++, word));
      }
      const actionWordList = actionWordOrList.actionWordList();
      if (actionWordList) {
        const wordList: Word[] = [];
        for (const actionWord of actionWordList.actionWord()) {
          const word = actionWord.accept(visitor);
          words.push(word);
          wordList.push(word);
        }
        conditions.push(wordMatchesAny(pos++, ...wordList));
      }
    }
    return conditions;
  }

  conditions(ctx: ActionDeclarationContext): Condition[] {
    const visitor = new ActionConditionDeclarationVisitor();
    const conditions = ctx
      .actionConditionDeclaration()
      .map((context) => context.accept(visitor));
    return conditions;
  }

  results(ctx: ActionDeclarationContext): Result[] {
    const visitor = new ActionResultDeclarationVisitor();
    return ctx
      .actionResultDeclaration()
      .map((context) => context.accept(visitor));
  }
}

class ActionWordVisitor
  extends AbstractParseTreeVisitor<Word>
  implements AdventureVisitor<Word>
{
  defaultResult(): Word {
    return Word.UNRECGONIZED;
  }

  visitActionWordWord(ctx: ActionWordWordContext): Word {
    return Word.of(ctx.text);
  }

  visitActionWordDirection(ctx: ActionWordDirectionContext): Word {
    return Word.of(ctx.exitDirection().text);
  }

  visitActionWordAny(ctx: ActionWordAnyContext): Word {
    return Word.ANY;
  }

  visitActionWordNone(ctx: ActionWordNoneContext): Word {
    return Word.NONE;
  }

  visitActionWordUnknown(ctx: ActionWordUnknownContext): Word {
    return Word.UNRECGONIZED;
  }
}

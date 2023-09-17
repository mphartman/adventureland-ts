import { CharStreams, CommonTokenStream } from 'antlr4ts';
import { AbstractParseTreeVisitor } from 'antlr4ts/tree/AbstractParseTreeVisitor';
import { AdventureLexer } from '@grammar/AdventureLexer';
import {
  ActionConditionDeclarationContext,
  ActionDeclarationContext,
  ActionWordDirectionContext,
  ActionWordWordContext,
  AdventureContext,
  AdventureParser,
  ConditionCounterEqualsContext,
  ConditionCounterGreaterThanContext,
  ConditionCounterLessThanContext,
  ConditionFlagIsTrueContext,
  ConditionInRoomContext,
  ConditionItemCarriedContext,
  ConditionItemExistsContext,
  ConditionItemHasMovedContext,
  ConditionItemIsHereContext,
  ConditionItemIsPresentContext,
  ConditionRoomHasExitContext,
  GlobalParameterStartContext,
  ItemDeclarationContext,
  ItemInRoomContext,
  OccursDeclarationContext,
  ResultDecrementCounterContext,
  ResultDestroyContext,
  ResultDropContext,
  ResultGetContext,
  ResultGoContext,
  ResultGotoRoomContext,
  ResultIncrementCounterContext,
  ResultPrintContext,
  ResultPutContext,
  ResultPutHereContext,
  ResultPutWithContext,
  ResultResetCounterContext,
  ResultResetFlagContext,
  ResultSetCounterContext,
  ResultSetFlagContext,
  ResultSetStringContext,
  ResultSwapContext,
  RoomDeclarationContext,
  RoomExitContext,
  WordGroupContext,
} from '@grammar/AdventureParser';
import { AdventureVisitor } from '@grammar/AdventureVisitor';
import { Action } from './Action';
import { Adventure } from './Adventure';
import {
  carrying,
  compareCounter,
  Condition,
  exists,
  hasExit,
  hasExitMatchingCommandWordAt,
  hasMoved,
  here,
  inRoom,
  isFlagSet,
  not,
  notever,
  present,
  random,
  wordMatches,
  wordMatchesAny,
} from './Condition';
import { Item } from './Item';
import {
  decrementCounter,
  destroy,
  drop,
  get,
  go,
  goInDirectionMatchingCommandWordAt,
  incrementCounter,
  inventory,
  look,
  move,
  print,
  put,
  putWith,
  quit,
  resetCounter,
  resetFlag,
  Result,
  setCounter,
  setFlag,
  setString,
  swap,
} from './Result';
import { Exit, Room } from './Room';
import { Vocabulary } from './Vocabulary';
import { Word } from './Word';

type OptionalString = string | undefined;

function rooms(adventureContext: AdventureContext): Room[] {
  const visitor = new RoomDeclarationVisitor();
  return adventureContext
    .gameElement()
    .map((context) => context.roomDeclaration()?.accept(visitor))
    .filter((room) => room) as Room[];
}

function startingRoomName(adventureContext: AdventureContext): OptionalString {
  const visitor = new GlobalParameterStartVisitor();
  return adventureContext
    .globalParameter()
    .map((parameter) => parameter.accept(visitor))
    .find((value, index) => (index === 0 ? value : undefined));
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

function checkExits(rooms: Room[]) {
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
}

function checkItems(items: Item[] | undefined, rooms: Room[]) {
  if (items?.length) {
    const everyItemInExistingRoom = items?.every(
      (item) =>
        item.currentRoom === Room.NOWHERE.name ||
        item.currentRoom === Room.INVENTORY.name ||
        rooms.find((room) => room.name === item.currentRoom)
    );
    if (!everyItemInExistingRoom) {
      throw new Error('One or more items reference non-existent rooms');
    }
  }
}

export class AdventureScriptParser {
  parse(adventureScriptText: string): Adventure {
    const inputStream = CharStreams.fromString(adventureScriptText);
    const lexer = new AdventureLexer(inputStream);
    const parser = new AdventureParser(new CommonTokenStream(lexer));
    parser.removeErrorListeners();
    parser.addErrorListener({
      syntaxError(
        _recognizer,
        _offendingSymbol,
        _line,
        _charPositionInLine,
        msg
      ): void {
        throw new Error(msg);
      },
    });

    const adventure = new RealAdventureVisitor().visitAdventure(
      parser.adventure()
    );

    // validate
    // each rooms exits reference a room which exists
    checkExits(adventure.rooms);
    // is each item in a room which exists
    checkItems(adventure.items, adventure.rooms);

    return adventure;
  }
}

class RealAdventureVisitor
  extends AbstractParseTreeVisitor<Adventure>
  implements AdventureVisitor<Adventure>
{
  defaultResult() {
    return new Adventure();
  }

  visitAdventure(ctx: AdventureContext): Adventure {
    const theRooms = rooms(ctx);

    const theStartingRoomName = startingRoomName(ctx);
    let startingRoom = theRooms.find(
      (room) => room.name === theStartingRoomName
    );
    if (startingRoom === undefined) {
      if (theRooms.length > 0) {
        startingRoom = theRooms[0];
      } else {
        startingRoom = Room.NOWHERE;
      }
    }

    return {
      vocabulary: vocabulary(ctx),
      rooms: theRooms,
      startingRoom: startingRoom,
      items: items(ctx),
      actions: actions(ctx),
      occurs: occurs(ctx),
    };
  }
}

class GlobalParameterStartVisitor
  extends AbstractParseTreeVisitor<OptionalString>
  implements AdventureVisitor<OptionalString>
{
  protected defaultResult(): OptionalString {
    return undefined;
  }

  visitGlobalParameterStart(ctx: GlobalParameterStartContext): OptionalString {
    return ctx.startParameter().roomName().text;
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
    return Word.UNRECOGNIZED;
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

  visitItemIsInInventory() {
    return { inventory: true, room: Room.INVENTORY.name };
  }

  visitItemIsNowhere() {
    return { nowhere: true, room: Room.NOWHERE.name };
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
    return notever();
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

  visitConditionItemCarried(ctx: ConditionItemCarriedContext): Condition {
    return carrying(ctx.itemName().text);
  }

  visitConditionItemIsHere(ctx: ConditionItemIsHereContext): Condition {
    return here(ctx.itemName().text);
  }

  visitConditionItemIsPresent(ctx: ConditionItemIsPresentContext): Condition {
    return present(ctx.itemName().text);
  }

  visitConditionItemExists(ctx: ConditionItemExistsContext): Condition {
    return exists(ctx.itemName().text);
  }

  visitConditionItemHasMoved(ctx: ConditionItemHasMovedContext): Condition {
    return hasMoved(ctx.itemName().text);
  }

  visitConditionFlagIsTrue(ctx: ConditionFlagIsTrueContext): Condition {
    return isFlagSet(ctx.word().text);
  }

  visitConditionCounterEquals(ctx: ConditionCounterEqualsContext): Condition {
    const num = parseInt(ctx.Number().text);
    return compareCounter(ctx.word().text, (val) => val === num);
  }

  visitConditionCounterLessThan(
    ctx: ConditionCounterLessThanContext
  ): Condition {
    const num = parseInt(ctx.Number().text);
    return compareCounter(ctx.word().text, (val) => val < num);
  }

  visitConditionCounterGreaterThan(
    ctx: ConditionCounterGreaterThanContext
  ): Condition {
    const num = parseInt(ctx.Number().text);
    return compareCounter(ctx.word().text, (val) => val > num);
  }

  visitConditionRoomHasExit(ctx: ConditionRoomHasExitContext): Condition {
    if (!ctx.word()) {
      return hasExitMatchingCommandWordAt(1);
    } else {
      const word = ctx.word()?.text as string;
      if (word.startsWith('$')) {
        const pos = parseInt(word.substring(1));
        return hasExitMatchingCommandWordAt(pos);
      } else {
        return hasExit(word);
      }
    }
  }
}

class ActionResultDeclarationVisitor
  extends AbstractParseTreeVisitor<Result>
  implements AdventureVisitor<Result>
{
  defaultResult(): Result {
    return () => false;
  }

  visitResultPrint(ctx: ResultPrintContext): Result {
    if (ctx._message.text) {
      return print(ctx._message.text);
    }
    return this.defaultResult();
  }

  visitResultLook(): Result {
    return look();
  }

  visitResultGo(ctx: ResultGoContext): Result {
    if (!ctx.word()) {
      return goInDirectionMatchingCommandWordAt(1);
    } else {
      const word = ctx.word()?.text as string;
      if (word.startsWith('$')) {
        const pos = parseInt(word.substring(1));
        return goInDirectionMatchingCommandWordAt(pos);
      } else {
        return go(word);
      }
    }
  }

  visitResultQuit(): Result {
    return quit();
  }

  visitResultInventory(): Result {
    return inventory();
  }

  visitResultSwap(ctx: ResultSwapContext): Result {
    return swap(ctx._i1.text, ctx._i2.text);
  }

  visitResultGotoRoom(ctx: ResultGotoRoomContext): Result {
    return move(ctx.roomName().text);
  }

  visitResultPut(ctx: ResultPutContext): Result {
    return put(ctx.itemName().text, ctx.roomName().text);
  }

  visitResultPutHere(ctx: ResultPutHereContext): Result {
    return put(ctx.itemName().text);
  }

  visitResultGet(ctx: ResultGetContext): Result {
    return get(ctx.itemName().text);
  }

  visitResultDrop(ctx: ResultDropContext): Result {
    return drop(ctx.itemName().text);
  }

  visitResultPutWith(ctx: ResultPutWithContext): Result {
    return putWith(ctx._i1.text, ctx._i2.text);
  }

  visitResultDestroy(ctx: ResultDestroyContext): Result {
    return destroy(ctx.itemName().text);
  }

  visitResultSetFlag(ctx: ResultSetFlagContext): Result {
    const name = ctx.word().text;
    const val = ['yes', 'true', 'on'].includes(ctx.booleanValue().text);
    return setFlag(name, val);
  }

  visitResultResetFlag(ctx: ResultResetFlagContext): Result {
    return resetFlag(ctx.word().text);
  }

  visitResultSetCounter(ctx: ResultSetCounterContext): Result {
    return setCounter(ctx.word().text, parseInt(ctx.Number().text));
  }

  visitResultIncrementCounter(ctx: ResultIncrementCounterContext): Result {
    return incrementCounter(ctx.word().text);
  }

  visitResultDecrementCounter(ctx: ResultDecrementCounterContext): Result {
    return decrementCounter(ctx.word().text);
  }

  visitResultResetCounter(ctx: ResultResetCounterContext): Result {
    return resetCounter(ctx.word().text);
  }

  visitResultSetString(ctx: ResultSetStringContext): Result {
    return setString(ctx._k.text, ctx._v.text);
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
    const results = this.results(ctx);
    return new Action(conditions, results);
  }

  command(ctx: ActionDeclarationContext): Condition[] {
    let pos = 1;
    const conditions: Condition[] = [];
    const visitor = new ActionWordVisitor();
    for (const actionWordOrList of ctx.actionCommand().actionWordOrList()) {
      const actionWord = actionWordOrList.actionWord();
      if (actionWord) {
        const word = actionWord.accept(visitor);
        conditions.push(wordMatches(pos++, word));
      }
      const actionWordList = actionWordOrList.actionWordList();
      if (actionWordList) {
        const wordList: Word[] = [];
        for (const actionWord of actionWordList.actionWord()) {
          const word = actionWord.accept(visitor);
          wordList.push(word);
        }
        conditions.push(wordMatchesAny(pos++, ...wordList));
      }
    }
    return conditions;
  }

  conditions(ctx: ActionDeclarationContext): Condition[] {
    const visitor = new ActionConditionDeclarationVisitor();
    return ctx
      .actionConditionDeclaration()
      .map((context) => context.accept(visitor));
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
    return Word.UNRECOGNIZED;
  }

  visitActionWordWord(ctx: ActionWordWordContext): Word {
    return Word.of(ctx.text);
  }

  visitActionWordDirection(ctx: ActionWordDirectionContext): Word {
    return Word.of(ctx.exitDirection().text);
  }

  visitActionWordAny(): Word {
    return Word.ANY;
  }

  visitActionWordNone(): Word {
    return Word.NONE;
  }

  visitActionWordUnknown(): Word {
    return Word.UNRECOGNIZED;
  }
}

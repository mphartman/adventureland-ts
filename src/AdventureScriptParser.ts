import { CharStreams, CommonTokenStream } from 'antlr4ts';
import { AbstractParseTreeVisitor } from 'antlr4ts/tree/AbstractParseTreeVisitor';
import { AdventureLexer } from '../generated/grammar/AdventureLexer';
import {
  AdventureContext,
  AdventureParser,
  ItemDeclarationContext,
  ItemInRoomContext,
  ItemIsInInventoryContext,
  ItemIsNowhereContext, RoomDeclarationContext,
  RoomExitContext,
  WordGroupContext
} from '../generated/grammar/AdventureParser';
import { AdventureVisitor } from '../generated/grammar/AdventureVisitor';
import { Adventure, Exit, Item, Room, Vocabulary, Word } from './Adventure';

export class AdventureScriptParser {
  public readonly adventure: Adventure;

  constructor(adventureScriptText: string) {
    const inputStream = CharStreams.fromString(adventureScriptText);
    const lexer = new AdventureLexer(inputStream);
    const parser = new AdventureParser(new CommonTokenStream(lexer));
    this.adventure = new RealAdventureVisitor().visit(parser.adventure());
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
    const rooms = this.getRooms(ctx);
    const items = this.getItems(ctx);
    const vocabulary = this.getVocabulary(ctx);
    return { rooms, items, vocabulary };
  }

  private getRooms(adventureContext: AdventureContext): Room[] {
    const visitor = new RoomDeclarationVisitor();
    return adventureContext
      .gameElement()
      .map((gameElementContext) =>
        gameElementContext.roomDeclaration()?.accept(visitor)
      )
      .filter((room) => room) as Room[];
  }

  private getItems(adventureContext: AdventureContext): Item[] {
    const visitor = new ItemVisitor();
    return adventureContext
      .gameElement()
      .map((gameElementContext) =>
        gameElementContext.itemDeclaration()?.accept(visitor)
      )
      .filter((item) => item) as Item[];
  }

  private getVocabulary(adventureContext: AdventureContext): Vocabulary {
    const visitor = new VocabularyDeclarationVisitor();
    const words = adventureContext
      .gameElement()
      .map((gameElementContext) =>
        gameElementContext.vocabularyDeclaration()?.accept(visitor)
      )
      .filter((word) => word) as Word[];
    return new Vocabulary(words);
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
    const roomExitVisitor = new RoomExitVisitor();
    const exits = ctx
      .roomExits()
      ?.roomExit()
      .map((roomExitContext) => roomExitContext.accept(roomExitVisitor));
    return new Room(ctx.roomName().text, ctx.roomDescription().text, exits);
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
      .map((itemAliasContext) => itemAliasContext.text);
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

  visitItemIsInInventory(_: ItemIsInInventoryContext) {
    return { inventory: true };
  }

  visitItemIsNowhere(_: ItemIsNowhereContext) {
    return { nowhere: true };
  }
}

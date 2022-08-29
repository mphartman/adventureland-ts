import { CharStreams, CommonTokenStream } from 'antlr4ts';
import { AbstractParseTreeVisitor } from 'antlr4ts/tree/AbstractParseTreeVisitor';
import { AdventureLexer } from '../generated/grammar/AdventureLexer';
import {
  AdventureContext,
  AdventureParser,
  GlobalParameterStartContext,
  RoomDeclarationContext,
  RoomExitContext,
  WordGroupContext,
} from '../generated/grammar/AdventureParser';
import { AdventureVisitor } from '../generated/grammar/AdventureVisitor';
import { Adventure, Room, Exit, Vocabulary, Word } from './Adventure';

export class AdventureScriptParser {
  public readonly adventure: Adventure;

  constructor(adventureScriptText: string) {
    const inputStream = CharStreams.fromString(adventureScriptText);
    const lexer = new AdventureLexer(inputStream);
    const parser = new AdventureParser(new CommonTokenStream(lexer));
    this.adventure = new RealAdventureVisitor().visit(parser.adventure());
  }
}

abstract class AbstractVisitor<T>
  extends AbstractParseTreeVisitor<T>
  implements AdventureVisitor<T>
{
  defaultResult(): T {
    return {} as T;
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
    const vocabulary = this.getVocabulary(ctx);

    const startingRoom = ctx.globalParameter().map((p) =>
      p.accept(
        new (class extends AbstractVisitor<string> {
          visitGlobalParameterStart(ctx: GlobalParameterStartContext) {
            return ctx.startParameter().roomName().text;
          }
        })()
      )
    )[0];

    return { rooms, vocabulary };
  }

  private getRooms(adventureContext: AdventureContext) {
    const visitor = new RoomDeclarationVisitor();
    return adventureContext
      .gameElement()
      .map((gameElementContext) =>
        gameElementContext.roomDeclaration()?.accept(visitor)
      )
      .filter((room) => room) as Room[];
  }

  private getVocabulary(adventureContext: AdventureContext) {
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
    const roomExitVisitor = new ExitVisitor();
    const exits = ctx
      .roomExits()
      ?.roomExit()
      .map((roomExitContext) => roomExitContext.accept(roomExitVisitor));
    return new Room(ctx.roomName().text, ctx.roomDescription().text, exits);
  }
}

class ExitVisitor
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

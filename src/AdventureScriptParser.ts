import { CharStreams, CommonTokenStream } from 'antlr4ts';
import { AbstractParseTreeVisitor } from 'antlr4ts/tree/AbstractParseTreeVisitor';
import { AdventureLexer } from '../dist/grammar/AdventureLexer';
import {
  AdventureContext,
  AdventureParser,
  GlobalParameterContext,
  GlobalParameterStartContext,
  RoomDeclarationContext,
  RoomExitContext,
} from '../grammar/AdventureParser';
import { AdventureVisitor } from '../dist/grammar/AdventureVisitor';
import { Adventure } from './Adventure';

export class AdventureScriptParser {
  readonly adventure: Adventure;

  constructor(adventureScriptText: string) {
    let inputStream = CharStreams.fromString(adventureScriptText);
    let lexer = new AdventureLexer(inputStream);
    let parser = new AdventureParser(new CommonTokenStream(lexer));
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
    console.log('visiting adventure');

    this.getRooms(ctx);

    const startingRoom = ctx.globalParameter().map((p) =>
      p.accept(
        new (class extends AbstractVisitor<string> {
          visitGlobalParameterStart(ctx: GlobalParameterStartContext) {
            return ctx.startParameter().roomName().text;
          }
        })()
      )
    )[0];
    console.log(startingRoom);

    return {};
  }

  getRooms(adventureContext: AdventureContext) {
    const visitor = new RoomDeclarationVisitor();
    adventureContext
      .gameElement()
      .forEach((gameElementContext) =>
        gameElementContext.roomDeclaration()?.accept(visitor)
      );
  }
}

class RoomDeclarationVisitor
  extends AbstractParseTreeVisitor<void>
  implements AdventureVisitor<void>
{
  readonly roomExitVisitor = new RoomExitVisitor();

  defaultResult() {}

  visitRoomDeclaration(ctx: RoomDeclarationContext) {
    console.log(`found the room "${ctx.roomName().text}"`);
    ctx
      .roomExits()
      ?.roomExit()
      .forEach((roomExit) => roomExit.accept(this.roomExitVisitor));
  }
}

class RoomExitVisitor
  extends AbstractParseTreeVisitor<void>
  implements AdventureVisitor<void>
{
  defaultResult() {}

  visitRoomExit(ctx: RoomExitContext) {
    console.log(`found room exit ${ctx.exitDirection().text}`);
  }
}

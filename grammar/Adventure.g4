grammar Adventure;

options { language=JavaScript; }

//
// comments
//

COMMENT
    :   '/*' .*? '*/' -> skip
    ;

LINE_COMMENT
    :   ('//' | '#') ~[\r\n]* -> skip
    ;

//
// Keywords
//

ROOM            : 'room';
EXIT            : 'exit';

ITEM            : 'item';
AT              : 'at';
IN              : 'in';
INVENTORY       : 'inventory';
NOWHERE         : 'nowhere';
CALLED          : 'called';

ACTION          : 'action';
WHEN            : 'when';
AND             : 'and';
NOT             : 'not' | '!';
THEN            : 'then';
OCCURS          : 'occurs';

START           : 'start';

WORDGROUP       : 'wordgroup';
ANY             : 'any';
NONE            : 'none';
UNKNOWN         : 'unknown' | 'unrecognized';

CARRYING        : 'carrying';
HERE            : 'here';
PRESENT         : 'present';
EXISTS          : 'exists';
MOVED           : 'moved';
FLAG            : 'flag';
COUNTER_EQ      : 'counterEq';
COUNTER_LE      : 'counterLe';
COUNTER_GT      : 'counterGt';
HAS_EXIT        : 'hasExit' | 'has_exit';

PRINT           : 'print';
LOOK            : 'look';
GO              : 'go';
QUIT            : 'quit';
GAME_OVER       : 'game_over';
SWAP            : 'swap';
GOTO            : 'goto';
PUT             : 'put';
PUT_HERE        : 'putHere' | 'put_here' ;
GET             : 'get';
DROP            : 'drop';
PUT_WITH        : 'putWith' | 'put_with';
DESTROY         : 'destroy';
SET_FLAG        : 'setFlag' | 'set_flag' ;
RESET_FLAG      : 'resetFlag' | 'reset_flag' ;
SET_COUNTER     : 'setCounter' | 'set_counter' ;
INCR_COUNTER    : 'incrementCounter' | 'increment_counter' | 'incr' | '++' ;
DECR_COUNTER    : 'decrementCounter' | 'decrement_counter' | 'decr' | '--' ;
RESET_COUNTER   : 'resetCounter' | 'reset_counter' ;
SET_STRING      : 'setString' | 'set_string' ;

Number
    :   Digit+
    ;

Identifier
	:	LetterOrDigit+
	;

fragment
LetterOrDigit
    : Letter
    | Digit
    ;

fragment
Digit
    : [0-9]
    ;

fragment
Letter
    : [a-zA-Z$_]
    ;

StringLiteral
	:	'"' ('\\"' | ~'"')* '"'
	    {
			      this.text = this.text.substring(1, this.text.length - 1);
						this.text = this.text.replace(/\\n/g, '\r\n');
						this.text = this.text.replace(/\\\"/g, '"');
	    }
	;

WHITESPACE
    :  [ \t\r\n]+ -> skip
    ;

adventure
    :   globalParameter* gameElement+ EOF
    ;

gameElement
    :   roomDeclaration
    |   itemDeclaration
    |   vocabularyDeclaration
    |   actionDeclaration
    |   occursDeclaration
    ;

globalParameter
    :   startParameter      #globalParameterStart
    ;

roomDeclaration
    :   ROOM roomName roomDescription roomExits?
    ;

roomName
    :   Identifier
    ;

roomDescription
    :   StringLiteral
    ;

roomExits
    : roomExit (roomExit)*
    ;

roomExit
    :   EXIT exitDirection roomName?
    ;

exitDirection
    :   Identifier
    ;

startParameter
    :   START roomName
    ;

itemDeclaration
    :   ITEM itemName itemDescription itemLocation? itemAliases?
    ;

itemName
    :   Identifier
    ;

itemDescription
    :   StringLiteral
    ;

itemLocation
    :   (AT | IN)   roomName        #itemInRoom
    |   NOWHERE                     #itemIsNowhere
    |   INVENTORY                   #itemIsInInventory
    ;

itemAliases
    :   CALLED itemAlias (',' itemAlias)*
    ;

itemAlias
    :   Identifier
    ;

vocabularyDeclaration
    :   wordGroup
    ;

wordGroup
    :   WORDGROUP word (',' synonym)*
    ;

word
    :   (Identifier | StringLiteral)
    ;

synonym
    :   (Identifier | StringLiteral)
    ;

actionDeclaration
    :   ACTION actionCommand actionConditionDeclaration* actionResultDeclaration+
    ;

actionCommand
    :   actionWordOrList+
    ;

actionWordOrList
    : actionWord
    | actionWordList
    ;

actionWordList
    :   '(' actionWord (',' actionWord)* ')'
    ;

actionWord
    : (Identifier | StringLiteral)  # actionWordWord
    | exitDirection                 # actionWordDirection
    | ANY                           # actionWordAny
    | NONE                          # actionWordNone
    | UNKNOWN                       # actionWordUnknown
    ;

actionConditionDeclaration
    :   (WHEN | AND) (NOT)? actionCondition
    ;

actionCondition
    :   (IN | AT) roomName          # conditionInRoom
    |   CARRYING itemName           # conditionItemCarried
    |   HERE  itemName              # conditionItemIsHere
    |   PRESENT itemName            # conditionItemIsPresent
    |   EXISTS itemName             # conditionItemExists
    |   MOVED itemName              # conditionItemHasMoved
    |   FLAG word                   # conditionFlagIsTrue
    |   COUNTER_EQ word Number      # conditionCounterEquals
    |   COUNTER_LE word Number      # conditionCounterLessThan
    |   COUNTER_GT word Number      # conditionCounterGreaterThan
    |   HAS_EXIT word?              # conditionRoomHasExit
    ;

actionResultDeclaration
    :   (THEN | AND) actionResult
    ;

actionResult
    :   PRINT message=StringLiteral                 # resultPrint
    |   LOOK                                        # resultLook
    |   GO word?                                    # resultGo
    |   (QUIT | GAME_OVER)                          # resultQuit
    |   INVENTORY                                   # resultInventory
    |   SWAP i1=itemName i2=itemName                # resultSwap
    |   GOTO roomName                               # resultGotoRoom
    |   PUT itemName roomName                       # resultPut
    |   PUT_HERE itemName                           # resultPutHere
    |   GET itemName                                # resultGet
    |   DROP itemName                               # resultDrop
    |   PUT_WITH i1=itemName i2=itemName            # resultPutWith
    |   DESTROY itemName                            # resultDestroy
    |   SET_FLAG word booleanValue                  # resultSetFlag
    |   RESET_FLAG word                             # resultResetFlag
    |   SET_COUNTER word Number                     # resultSetCounter
    |   INCR_COUNTER word                           # resultIncrementCounter
    |   DECR_COUNTER word                           # resultDecrementCounter
    |   RESET_COUNTER word                          # resultResetCounter
    |   SET_STRING k=word v=word                    # resultSetString
    ;

booleanValue
    :   'true'
    |   'false'
    |   'yes'
    |   'no'
    |   'on'
    |   'off'
    |           // defaults to TRUE
    ;

occursDeclaration
    :   OCCURS (Number)? actionConditionDeclaration* actionResultDeclaration+
    ;

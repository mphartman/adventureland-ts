# Adventure Script format reference manual

This is the reference manual for the Adventureland script format.
With this format you can write your own [adventure game](https://en.wikipedia.org/wiki/Adventure_game)
story and play it using the Adventureland game engine.

## Table of Contents

- [Overview](#overview)
- [Global Parameters](#global-parameters)
- [Rooms](#rooms)
- [Items](#items)
- [Vocabulary](#vocabulary)
- [Actions](#actions)
- [Examples](#examples)
- [References](#references)

## Overview

An adventure story script, or script for short, is a text file written in a simple syntax which
describes the elements of the adventure world and how the player can interact with them.

### Example

        # adventure.txt - story script for the adventure 'Haunted House on Rural Route 1'

        room livingRoom "I'm in a small carpeted room with large windows looking out over a lake."
            exit east kitchen

        room kitchen "I'm in a cramped kitchen. The appliances look old and in disrepair."
            exit west livingRoom

        item microwave "a 1200-watt microwave oven"

        action open microwave
            when here microwave
            then print "Oh my goodness! How'd did that get in there? That's not right."

### Comments

Lines starting with `//` or `#` are treated as comments and are ignored.

Lines between `/*` and `*/` are considered multi-line comments and are also ignored.

### Global Parameters

#### start

The `start` keyword specifies the starting room of the adventure. It's where the player
will first start. It is followed by a `room` name.

        start kitchen

This example would mean the player starts in the `room` named `kitchen`.

## Rooms

A Room is a place or location in your adventure. It consists of a name, a description, and a set of exits.
An exit is a named direction which the player can go towards to arrive at another room. Typically an exit
is one of the compass directions like North, South, East, or West but it doesn't have to be.

### `room`

A Room must have a unique name. The name is made up of letters, numbers, and underscores (\_).
Both name and description are required. The description is displayed to the player. An optional set of
exits comes after the description.

        room kitchen "I'm in a small, cramped kitchen"

This defines a room named `kitchen`. The `room` keyword is followed by the name and the description
must be enclosed in double-quotes.

Spaces and newlines are ignored (except if inside the quotes). For example, this definition is identical to the one above.

        room
            kitchen
                "I'm in a small, cramped kitchen"

### `exit`

An Exit specifies that it's possible to move from one room to another. An Exit starts with the keyword
`exit` followed by a direction and an optional target room name. If a room name is not specified, the target
is assumed to be the exit's own room creating a sort of infinite loop (e.g. perhaps representing an endless deep forest).

        room kitchen "I'm in a small, cramped kitchen"
            exit south living_room

        room living_room "I'm in a cozy, warm living room"
            exit north kitchen

The exits (if any) are displayed to the player as part of the description of the room.

## Items

An item is any object in the game: a sword, a chest, a key, etc. They can reside in rooms, they can be
carried, they can be dropped. Items can also represent scenery like a sign, tree, door, etc.

An item definition starts with the keyword `item` and is followed by a required name and description.

        item knife "a sharp dinner knife"

Items in a room are displayed as part of the room's description.

### `at`

An item may start off at a particular room. Using the `at` keyword followed by an existing `room` name, the
item will appear at that location.

        item knife "a sharp dinner knife"
            at kitchen

#### `nowhere`

If no location is specified the item is considered to be in a special room named `nowhere`. This puts the item
in the game but initially out of play. Useful when item may later be swapped out for another item.

        item water_bottle "a bottle full of water"
            at inventory

        item empty_bottle "an empty bottle"
            at nowhere

#### `inventory`

Items you want the player to carry can use the special location `inventory`.

        item unlit_torch "an unlit wooden torch"
            at inventory

### `called`

Items which you want the player to be able to pickup and drop must have one or more aliases. This is used
for those items which are considered objects in the game as opposed to scenery items.

Aliases are defined using the keyword `called` and a comma-separated list of names. Alias names have the
same requirements as item names: letters, numbers, and underscores only.

        item unlit_torch "an unlit wooden torch"
            at inventory
            called torch

## Vocabulary

Vocabulary is made of the words which the game will recognize from the player's input. If the player types
in something which is not in the vocabulary that word will be identified as `unknown`.

Words used for room names, exit directions, item names and aliases, and actions are all automatically added to the game's
vocabulary so then do not need to be explicitly declared.

### `wordgroup`

A `wordgroup` is a word followed by comma-separated list of synonyms. It's good practice to enclose words and
synonyms in double-quotes.

        wordgroup "help", "?"

This example defines "help" as a word and "?" as a synonym. You can then use this word in action definitions.
In this example, if the user types "help" or "?" it will be recognized as the word "help".

        wordgroup "go", "goto", "enter", "walk", "run", "exit", "leave"

This example means the player can type "go", "goto", "enter", "walk", "run", "exit", or "leave" and they all
be recognized as the word "go".

This gives you the ability to have a lot of natural language alternatives without having to duplicate actions
to recognize all the variations.

## Actions

Actions are the things the player can do, or which can happen to the player. The result of actions change
the state of the game world.

An action definition is compromised of a command, a optional set of one or more conditions,
and a set of one or more results.

During a turn, all actions are evaluated and the first to match is executed. The remaining actions are skipped.
This means the order of the actions within the adventure script file is important.

A action is considered a match if the player's input matches the action's command and all the action's
conditions are true.

### `action`

An action starts with the keyword `action` and a command which consists of one or more words. An action is not limited to only two words.

        action drop knife
            when carrying knife
            then drop knife

This example defines a new action which occurs when the player types a command equivalent to the one specified.
This means typing "drop" or any of its synonyms and "knife" and any of its synonyms will constitute a match.

For example, given this definition:

        wordgroup "drop", "discard"
        wordgroup "knife", "utensil"

        action drop knife
            when carrying knife
            then drop knife

if the player types this command:

        > discard utensil

this action's command would be considered equivalent to the player's command because "discard" is a synonym
to "drop" and "utensil" is a synonym of "knife"

#### `when`

Using the keyword `when` following an action specifies a logical condition which must resolve to true in order
for the results to happen. Setting conditions on an action is optional.

You may specify multiple conditions using the keyword `and`

        action kill fly
            when carrying flyswatter
                and here fly
            then print "Got 'em!"

This example defines an action with conditions that indicate the player must be both carrying an item named
flyswatter and that there is an item named fly in the current room. Both conditions must be true before the
result `print` will happen.

Note that whitespace around directives like room, item, and action including newlines and tabs are ignored.

This is identical to the above directive:

        action kill fly when carrying flyswatter and here fly then print "Got 'em!"

##### `not`

The `not` keyword may be applied to a condition to define a negation or logical complement which turns
a true condition into false and a false condition into true.

        action jump on train
            when not here train
            then print "The train isn't here yet."

See [Conditions](#conditions) for a list of possible conditions.

#### `then`

The `then` keyword is used in an action definition to represent the outcome or consequence of the
action. It can change the state of the game world or print text to the display.

An `action` must have at least one `then` statement (otherwise what's the point?)

See [Results](#results) for a list of possible results.

### `occurs`

An `occurs` is a special kind of action which happens before the player's turn. It has no command words.

An `occurs` may have one or more conditions and must have at least one result.

The most important difference between an `occurs` and an `action` is that unlike an action, **all**
`occurs` are evaluated and if multiple have their conditions satisfied, then all their results are
executed. In contrast, at most only one `action` will happen on a turn.

    occurs
        when carrying knife
            and in kitchen
        then print "Gary says to you, 'Looks like you're ready to chop some vegetables.'"

This example defines an `occurs` such that if the player has an item named "knife" in their inventory
and are currently in a room named "kitchen" then the message is printed to the display. This would
happen before the player types their command.

Setting a number after the keyword `occurs` defines a random occurs. The number must be between 1-99 and
represents the probability of the occurs happening that turn.

    occurs 25
        then print "A soft wind blows."

This example defines an `occurs` with a 25% chance of happening each turn.

### Conditions

A condition is a logical statement applied to an `action` or `occurs` definition which must evaluate to
true in order for the `action` or `occurs` to happen.

A condition is a single keyword followed by zero or more arguments.

The following condition keywords are supported:

- ## `at` _ROOM_

  True if the player's current room is _ROOM_ which must be the name of an existing `room`

- ## `in` _ROOM_

  Synonym to `at` to make script more natural-language like

- ## `carrying` _ITEM_

  True if the player's inventory contains _ITEM_ which must be the name of an existing `item`

- ## `here` _ITEM_

  True if _ITEM_ resides in the player's current room where _ITEM_ is the name of an existing `item`

- ## `present` _ITEM_

  True if the player is either carrying _ITEM_ or the _ITEM_ is in the current room. I.e. `carrying` _ITEM_
  is true or `here` _ITEM_ is true.

- ## `exists` _ITEM_

  True if _ITEM_ exists somewhere in the game. I.e. is not `nowhere`.

- ## `moved` _ITEM_

  True if _ITEM_ has been moved from its original starting location. This does not track item history so
  for example if an item is picked up from one room, dropped in another, then picked and dropped again
  in the original room, `moved` would be false.

- ## `flag` _FLAG_

  True if _FLAG_ is true. _FLAG_ is any valid identifier which you can use to track some on/off state,
  e.g. `lampLit`

- ## `counter_eq` _COUNTER_ _NUMBER_

  True if _COUNTER_ equals the number _NUMBER_. _COUNTER_ is any valid identifier, e.g. `numberOfKills`

- ## `counter_lte` _COUNTER_ _NUMBER_

  True if _COUNTER_ is less than or equal to the number _NUMBER_.

- ## `counter_gt` _COUNTER_ _NUMBER_

  True if _COUNTER_ is greater than to the number _NUMBER_.

- ## `has_exit` _DIRECTION_
  True if the current room has an `exit` matching _DIRECTION_

### Results

A result is the consequence of an `action` which changes the state of the game world.

A result is a single keyword followed by zero or more arguments. An `action` must have at least one result.

Multiple results if given are executed in the order they appear on the `action`. Results may be
separated by the keyword `and`.

The following results are supported:

- ## `print` _MESSAGE_

  Prints _MESSAGE_ to the player's display. _MESSAGE_ must be surrounded by double quotes (") and may contain
  newlines, tabs, or spaces all of which will appear as-is to the player. Double quotes may be escaped using
  the escape character '\'.

- ## `look`

  Displays the description of the current along with any exits and items that reside there.

- ## `go` _WORD_

  Moves player through the exit in the current room identified by _WORD_. Nothing happens if no
  such exit exists.

- ## `quit`

  Ends the game.

- ## `game_over`

  Same as `quit`.

- ## `inventory`

  Displays the description of the items currently in the player's inventory.

- ## `swap` _ITEM1_ _ITEM2_

  Exchanges the specified items such that _ITEM1_ is now in _ITEM2_'s `room`
  and _ITEM2_ is in _ITEM1_'s `room`. This is handy for switching items in and out of the game.

- ## `goto` _ROOM_

  Moves the player to _ROOM_.

- ## `put` _ITEM_ _ROOM_

  Puts _ITEM_ in _ROOM_.

- ## `put_here` _ITEM_

  Puts _ITEM_ in the player's current room.

- ## `get` _ITEM_

  Places _ITEM_ in the player's inventory.

- ## `drop` _ITEM_

  Puts _ITEM_ in the player's current room. Same as `put_here`.

- ## `put_with` _ITEM1_ _ITEM2_

  Put _ITEM1_ in the same `room` as _ITEM2_.

- ## `destroy` _ITEM_

  Put _ITEM_ in `nowhere`.

- ## `set_flag` _FLAG_ _BOOLEAN_

  Set _FLAG_ to the given boolean value which can be any of the following:
  true, false, on, off, yes, no.

- ## `reset_flag` _FLAG_

  Removes _FLAG_ which has the same effect as setting it to false.

- ## `set_counter` _COUNTER_ _NUMBER_

  Assigns the number _NUMBER_ to the counter _COUNTER_.

- ## `incr_counter` _COUNTER_

  Increments _COUNTER_ by one.

- ## `decr_counter` _COUNTER_

  Decrements _COUNTER_ by one.

- ## `reset_counter` _COUNTER_
  Removes the counter _COUNTER_ which has the same effect as setting it to zero.

## Examples

- [Example Adventure 1 - Van Escape](example_adventure_1.txt)

## References

- Scott Adams - Official Site (http://www.msadams.com/index.htm)
- An Adventure In Small Computer Game Simulation (http://mud.co.uk/richard/aaiscgs.htm)
- Mike Taylor's ScottKit Reference Manual (https://github.com/MikeTaylor/scottkit/blob/master/docs/reference.md)

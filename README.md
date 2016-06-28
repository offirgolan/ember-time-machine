# Ember Time Machine

[![Build Status](https://travis-ci.org/offirgolan/ember-time-machine.svg)](https://travis-ci.org/offirgolan/ember-time-machine)
[![npm version](https://badge.fury.io/js/ember-time-machine.svg)](http://badge.fury.io/js/ember-time-machine)
[![Code Climate](https://codeclimate.com/github/offirgolan/ember-time-machine/badges/gpa.svg)](https://codeclimate.com/github/offirgolan/ember-time-machine)
[![Test Coverage](https://codeclimate.com/github/offirgolan/ember-time-machine/badges/coverage.svg)](https://codeclimate.com/github/offirgolan/ember-time-machine/coverage)
[![Dependency Status](https://david-dm.org/offirgolan/ember-time-machine.svg)](https://david-dm.org/offirgolan/ember-time-machine)

Say you are building a form, what’s the best way to handle the state of an underlying model? How do you revert unwanted changes? Do you use a buffer or take snapshots? What if your model has relationships, and those relationships have relationships?

While Ember is a leading framework for building ambitious applications, it lacks the important ability to manage complex object state. Introducing Ember Time Machine, an addon that challenges this current issue and its limitations with a single command solution.

## Features

- Single line of code to start
- Support for both Ember Objects and Arrays, as well as, Ember Data models
- Tracks nested relational changes out of the box (including `hasMany` and `belongsTo` relationships)
- Ability to revert array manipulations as well as object property changes
- No buffer used so all changes are made on the actual model
- Intelligently batches property changes when undoing and redoing

## Installation

```
ember install ember-time-machine
```

## Helpful Links

- ### [Live Demo](http://offirgolan.github.io/ember-time-machine)

- ### [Changelog](CHANGELOG.md)

## Looking for help?
If it is a bug [please open an issue on GitHub](http://github.com/offirgolan/ember-time-machine/issues).

## Usage

### Objects

__Setup__

```javascript
import TimeMachine from 'ember-time-machine';

const content = Ember.Object.create({
  firstName: 'Offir'
});

const timeMachine = TimeMachine.Object.create({ content });
```

__Manipulate__

```javascript
timeMachine.get('firstName'); // --> 'Offir'
timeMachine.set('lastName', 'Golan');
```

__Undo & Redo__

```javascript
timeMachine.get('lastName'); // --> 'Golan'
timeMachine.undo();
timeMachine.get('lastName'); // --> undefined
timeMachine.redo();
timeMachine.get('lastName'); // --> 'Golan'
```

### Arrays

__Setup__

```javascript
import TimeMachine from 'ember-time-machine';

const timeMachine = TimeMachine.Array.create({ content: Ember.A([ 'offir' ]) });
```

__Manipulate__

```javascript
timeMachine.get('firstObject'); // --> 'Offir'
timeMachine.pushObject('Golan');
```

__Undo & Redo__

```javascript
timeMachine.objectAt(1); // --> 'Golan'
timeMachine.undo();
timeMachine.objectAt(1); // --> undefined
timeMachine.redo();
timeMachine.objectAt(1); // --> 'Golan'
```

## Options

#### ignoredProperties ( _Array_ )

Properties that will be ignored by the time machine. Supports nested keys including `@each`

```javascript
const ignoredProperties = ['someProp', 'obj.array.@each.somProp'];

const objectMachine = TimeMachine.Object.create({ content, ignoredProperties });

const arrayMachine = TimeMachine.Array.create({ content, ignoredProperties });
```

#### frozenProperties ( _Array_ )

Properties that will not be modified. Supports nested keys including `@each`

```javascript
const content = Ember.Object.create({ array: Ember.A() });
const frozenProperties = ['someProp', 'array', 'obj.array.@each.somProp'];

const timeMachine = TimeMachine.Object.create({ content, frozenProperties });

timeMachine.set('someProp', 'foo');
timeMachine.get('someProp'); // --> undefined

timeMachine.set('someOtherProp', 'bar');
timeMachine.get('someOtherProp'); // --> 'bar'

timeMachine.get('array').pushObject('baz');
timeMachine.get('array').objectAt(0); // --> undefined
```

#### maxDepth ( _Number_ )

The Max nested level to track changes emitted by children of the receiver.
If set to `-1`, all nested children will be tracked.

__Default: -1__

```javascript
// Only track root level changes made by the receiver
const objectMachine = TimeMachine.Object.create({ content,  maxDepth: 0 });

// Track changes up to 2 levels deep ( model.friends.firstName )
const objectMachine = TimeMachine.Object.create({ content,  maxDepth: 2 });
```

#### shouldWrapValue ( _Function_ )

_Params:_

  - value ( __Unknown__ ): The value that will be wrapped
  - timeMachine ( __TimeMachine__ ): The current Time Machine that this value belongs under
  - key ( __String__ ): The object's key that the value came from

Currently, any value of type `instance`, `object`, and `array` (via Ember.typeOf) will automatically be wrapped in their
own Time Machine. If you don't want specific values to be wrapped, this is the place to do it.

```javascript
const shouldWrapValue = function(value, timeMachine, key) {
  return !(value instanceof moment) || key.indexOf('foo') !== -1;
}

const objectMachine = TimeMachine.Object.create({ content, shouldWrapValue });
```

## API

### Properties

#### canUndo ( _Boolean_ )

Determines if undo operations can be done

#### canRedo ( _Boolean_ )

Determines if redo operations can be done

### Methods

#### undo ( _numUndos_ , _options_ )

Undo the specified amount of changes that were recorded on the root machine and its children

_Params:_

  - numUndos ( __Number__ ): Amount of undo operations to do. Defaults to 1
  - options  ( __Object__ ):
    - on       ( __Array__ ): Only run undo operations on the given keys
    - excludes ( __Array__ ): Exclude undo operations on the given keys

_Returns:_

(  __Array__ )  All records that were undone

```javascript
timeMachine.undo(); // Undo the last recorded change
timeMachine.undo(5, { on: ['firstName'] }); // Undo the last 5 changes to firstName
```

#### undoAll ( _options_ )

Undo all changes that were recorded on the root machine and its children

_Params:_

  - options  ( __Object__ ):
    - on       ( __Array__ ): Run all undo operations on the given keys
    - excludes ( __Array__ ): Exclude undo operations on the given keys

_Returns:_

(  __Array__ )  All records that were undone

```javascript
timeMachine.undoAll();
timeMachine.undoAll({ on: ['tasks.@each.isCompleted'], excludes: ['tasks.0.isCompleted'] });
```

#### redo ( _numRedos_, _options_ )

Redo the specified amount of changes that were undone on the root machine and its children

_Params:_

  - numRedos ( __Number__ ): Amount of redo operations to do. Defaults to 1
  - options  ( __Object__ ):
    - on       ( __Array__ ): Only run redo operations on the given keys
    - excludes ( __Array__ ): Exclude redo operations on the given keys

_Returns:_

(  __Array__ )  All records that were redone

```javascript
timeMachine.redo(); // Redo the last undo operation
timeMachine.redo(5, { on: ['firstName'] }); // Redo the last 5 undo operation to firstName
```

#### redoAll ( _options_ )

Redo all changes that were undone on the root machine and its children

_Params:_

  - options  ( __Object__ ):
    - on       ( __Array__ ): Run all redo operations on the given keys
    - excludes ( __Array__ ): Exclude redo operations on the given keys

_Returns:_

(  __Array__ )  All records that were redone

```javascript
timeMachine.redoAll();
timeMachine.redoAll({ on: ['tasks.@each.isCompleted'], excludes: ['tasks.0.isCompleted'] });
```

#### commit ( )

Clears all recorded changes and resets the state of the root machine and all its children

```javascript
timeMachine.commit();
```

#### invoke ( _methodName_, _...args_ )

Invokes the named method on the receiver or on every object if the receiver is an array

_Params:_

  - methodName ( __String__ )   : The name of the method
  - args       ( __Object...__ ): Optional arguments to pass

_Returns:_

(  __Unknown__ )  Values from calling invoke

```javascript
timeMachine.invoke('save'); // === timeMachine.get('content').save();
timeMachine.invoke('set', 'foo', 'bar'); // === timeMachine.get('content').set('foo', 'bar');
```


#### printRecords ( properties )

Neatly prints all current records to console

_Params:_

  - properties ( __Array__ )   : Override for which properties to be displayed

```javascript
timeMachine.printRecords();
timeMachine.printRecords(['key', 'before', 'after']);
```

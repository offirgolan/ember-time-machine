# Ember Time Machine

[![Build Status](https://travis-ci.org/offirgolan/ember-time-machine.svg)](https://travis-ci.org/offirgolan/ember-time-machine)
[![npm version](https://badge.fury.io/js/ember-time-machine.svg)](http://badge.fury.io/js/ember-time-machine)
[![Code Climate](https://codeclimate.com/github/offirgolan/ember-time-machine/badges/gpa.svg)](https://codeclimate.com/github/offirgolan/ember-time-machine)
[![Test Coverage](https://codeclimate.com/github/offirgolan/ember-time-machine/badges/coverage.svg)](https://codeclimate.com/github/offirgolan/ember-time-machine/coverage)
[![Dependency Status](https://david-dm.org/offirgolan/ember-time-machine.svg)](https://david-dm.org/offirgolan/ember-time-machine)

An object state management solution

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

## API

#### undo ( _numUndos_ )

Undo the specified amount of changes that were recorded on the root machine and its children

_Params_
	
  - numUndos ( __Number__ ): Amount of undo operations to do. Defaults to 1

_Returns:_

(  __Array__ )  All records that were undone

```javascript
timeMachine.undo();
timeMachine.undo(5);
```

#### undoAll ( )

Undo all changes that were recorded on the root machine and its children

_Returns:_

(  __Array__ )  All records that were undone

```javascript
timeMachine.undoAll();
```

#### redo ( _numRedos_ )

Redo the specified amount of changes that were undone on the root machine and its children

_Params:_

	- numRedos ( __Number__ ): Amount of redo operations to do. Defaults to 1

_Returns:_

(  __Array__ )  All records that were redone

```javascript
timeMachine.redo();
timeMachine.redo(5);
```

#### redoAll ( )

Redo all changes that were undone on the root machine and its children

_Returns:_

(  __Array__ )  All records that were redone

```javascript
timeMachine.redoAll();
```

#### commit ( )

Clears all recorded changes and resets the state of the root machine and all its children

```javascript
timeMachine.commit();
```

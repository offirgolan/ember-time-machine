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

- ### [Documentation](https://github.com/offirgolan/ember-time-machine/wiki)

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

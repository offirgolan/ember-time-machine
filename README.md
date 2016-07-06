# Ember Time Machine

[![Build Status](https://travis-ci.org/offirgolan/ember-time-machine.svg)](https://travis-ci.org/offirgolan/ember-time-machine)
[![npm version](https://badge.fury.io/js/ember-time-machine.svg)](http://badge.fury.io/js/ember-time-machine)
[![Code Climate](https://codeclimate.com/github/offirgolan/ember-time-machine/badges/gpa.svg)](https://codeclimate.com/github/offirgolan/ember-time-machine)
[![Test Coverage](https://codeclimate.com/github/offirgolan/ember-time-machine/badges/coverage.svg)](https://codeclimate.com/github/offirgolan/ember-time-machine/coverage)
[![Dependency Status](https://david-dm.org/offirgolan/ember-time-machine.svg)](https://david-dm.org/offirgolan/ember-time-machine)

Say you are building a form, what’s the best way to handle the state of an underlying model? How do you revert unwanted changes? Do you use a buffer or take snapshots? What if your model has relationships, and those relationships have relationships?

While Ember is a leading framework for building ambitious applications, it lacks the important ability to manage complex object state. Introducing Ember Time Machine, an addon that challenges this current issue and its limitations with a single command solution.

## Features

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

_**Note:** Ember Time Machine can be used with plain objects and arrays. This example is used to show the true potential of this addon_

```js
// models/user.js
export default DS.Model.extend({
  firstName: attr('string'),
  lastName: attr('string'),
  username: attr('string'),
  avatar: attr('string'),

  settings: DS.belongsTo('setting'),
  tasks: DS.hasMany('task')
});
```

__Setup__

```js
import TimeMachine from 'ember-time-machine';

const user = this.store.peekRecord('user', 1);

const timeMachine = TimeMachine.Object.create({ content: user });
```

__Manipulate__

```javascript
/** Basic Manipulations **/
timeMachine.set('username', 'offir.golan');

/** Nested Array Manipulations **/
timeMachine.get('tasks').setEach('isCompleted', true);

/** Nested Object Manipulations **/
timeMachine.set('settings.newOnTop', false);
```

__Time Travel__

```js
timeMachine.undo(1, { on : [ 'username' ] }); // Undo the last username change
timeMachine.undo(2, { on: [ 'tasks.@each.isCompleted' ] }); // Undo the last 2 isCompleted changes on the tasks collection
timeMachine.undoAll({ on: [ 'settings.*' ] }); // Undo all changes on the settings object
timeMachine.undoAll(); // Undo all changes

timeMachine.redo(1, { on : [ 'username' ] }); // Redo the last undone change to username
timeMachine.redoAll(); // Redo all changes that have been undone
```

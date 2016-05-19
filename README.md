# Ember Time Machine

[![Build Status](https://travis-ci.org/offirgolan/ember-time-machine.svg)](https://travis-ci.org/offirgolan/ember-time-machine)
[![npm version](https://badge.fury.io/js/ember-time-machine.svg)](http://badge.fury.io/js/ember-time-machine)
[![Code Climate](https://codeclimate.com/github/offirgolan/ember-time-machine/badges/gpa.svg)](https://codeclimate.com/github/offirgolan/ember-time-machine)
[![Test Coverage](https://codeclimate.com/github/offirgolan/ember-time-machine/badges/coverage.svg)](https://codeclimate.com/github/offirgolan/ember-time-machine/coverage)
[![Dependency Status](https://david-dm.org/offirgolan/ember-time-machine.svg)](https://david-dm.org/offirgolan/ember-time-machine)

Object state management solution

## Installation
```shell
ember install ember-time-machine
```

## Looking for help?
If it is a bug [please open an issue on GitHub](http://github.com/offirgolan/ember-time-machine/issues).

## Usage

```js
import TimeMachine from 'ember-time-machine';

const tm = TimeMachine.Object.create({
  content: model
});
```

```js
import TimeMachine from 'ember-time-machine';

const tm = TimeMachine.Array.create({
  content: model
});
```

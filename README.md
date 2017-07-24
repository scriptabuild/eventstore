## EventStore

A simple filebased eventsourced data store for node.js.

Instead of storing the current state of our data, eventsourcing lets us record our intention while creating/manipulating our data.

Eventstore is available as a npm package.

```bash
npm install @scriptabuild/eventstore
```
[![npm version](https://badge.fury.io/js/%40scriptabuild%2Feventstore.svg)](https://badge.fury.io/js/%40scriptabuild%2Feventstore)


Documentations is still a work in progress. Look at [our github pages](https://scriptabuild.github.io/eventstore/) or in [the `/docs` folder](./docs) to see what we've got so far...

## Main functionality of Eventstore
- It runs in-process in your javascript application, so no installation other than pulling in the npm package is neccessary.
- In node.js, it uses the file system for persistance by default. The data is stored in sequentilly numbered json files in the folder you (the developer) specifies.
- Eventstore will also run in other environments, like in the browser, but you will need to configure an alternative to the file system for persistance.
- Transactional batches. A batch either runs to completion and is then committed and stored. If the batch fails or for other reasons is aborted, the state is rolled back to the state at the beginning of the batch operation. (Ie. a batch is either fully completed, or not recorded at all.)
- Repeatable read isolation level.
- Concurrency. Will retry concurrent batches.
- All events are written to Eventstore in order, so that replay always will give the same result.

[Check out the tutorial to get started.](https://scriptabuild.github.io/eventstore/tutorial.html)

## Compatibility

Travis runs the test suite (mocha) in the latest version of node.js, as well as in v7.6.0.

[![Build Status](https://travis-ci.org/scriptabuild/eventstore.svg?branch=master)](https://travis-ci.org/scriptabuild/eventstore)


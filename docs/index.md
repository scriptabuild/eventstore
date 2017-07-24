## EventStore

Eventstore is a data store primarily for use with node.js. The store is based on eventsourcing principles (more information below).

Eventstore is awailable as a npm package.

```bash
npm install @scriptabuild/eventstore
```
[![npm version](https://badge.fury.io/js/%40scriptabuild%2Feventstore.svg)](https://badge.fury.io/js/%40scriptabuild%2Feventstore)

## Compatibility

Travis runs the test suite (mocha) in the latest version of node.js, as well as in v7.6.0.

[![Build Status](https://travis-ci.org/scriptabuild/eventstore.svg?branch=master)](https://travis-ci.org/scriptabuild/eventstore)

## Main functionality of eventstore
- It runs in-process in your javascript application, so no installation other than pulling in the npm package is neccessary.
- In node.js, it uses the file system for persistance by default. The data is stored in sequentially numbered json files in the folder you (the developer) specifies.
- Eventstore will also run in other environments, like in the browser, but you will need to configure an alternative to the file system for persistance.
- Transactional batches. A batch either runs to completion and is then committed and stored. If the batch fails or for other reasons is aborted, the state is rolled back to the state at the beginning of the batch operation. (Ie. a batch is either fully completed, or not recorded at all.)
- Repeatable read isolation level.
- Concurrency. Will retry concurrent batches.
- All events to the eventstore will end up having an order, so that replay always will give the same result.

[Check out the tutorial to get started.](./tutorial.md), [the API reference for `defineStore`](./defineStore.md), [documentation on creating the _model definition_](./modelDefinition.md) or [the patterns page](./patterns.md) for help on aggregating logs. 

## Pretext
In the classical main-stream architecture the applications we design and build
are often stateful. This means that we usually store a snapshot of the objects we deal
with in our application in a data store. The snapshot represents the state of
the object after the last modification. We continuously overwrite the previous
state or snapshot with the newest version in the data store, since there at any
one time can be only one version. In doing so, we lose the historical content
of the older versions.

For many kinds of data or content this might be more than sufficient since we
are not really interested in what was before and how we got to the state we
currently are in.

## So, what is Eventsourcing?
Instead of storing and updating the store to always show a view of the data at
some point in time, eventsourcing lets you keep all the changes made to to the data.

The intentions for an event are stored.

This audit trail of operations (while to some degree similar to an RDBMS' transactionlog) allows restoring the data to any point in time (as long as the log files are kept.)

One important differenting feature of the eventlog vs. the transactionlog (of an RDBMS) is in the way the log intentionally is made accessable to us, as opposed to with a database transaction log who's only concerns are to ensure integrity of the database, and the ability to rollback a transaction.

Intentions for an event are stored with the event, for a transactionlog entry the real intention is lost.

Replay is a important key feature to the entire eventsourcing system.

As replay is used everytime you need to inflate a model to query, you'll get more used to dealing with events and playing back the log. Replay has to be a very easy feature to use.

Some of the new habits of working with the eventsource will be:
- Doing multiple replays.
- Repeating a replay and stop where you want in that replay; Either by looking at header data (like the logged time) or the state of the model you're replaying to.

[Martin Fowlers article on Eventsourcing](https://martinfowler.com/eaaDev/EventSourcing.html) examines more aspects of eventsourcing, and is worth the read.

## What doesn't it do?

//TODO: Surely there must be something, mustn't it?

## Read/write models vs. Read models
A _read/write model_ allows you to work with existing data in an eventlog in a persisent way. Any changes made through the model are stored to the eventlog as an ordered and transactional item.

A _read model_ allows you to work with a model created by replaying the event logs. Any changes made to a read only model will be lost when the model is "closed".

You can also have the concept of a _write only_ model. In this case, you don't actually need to build a model, so the simplest way to implement this is by just using the `log(eventName, eventData)` and `logBlock(action)` methods.

## Transactional

Eventstore offers repeatable read isolation level with the transaction/batch model. These transactions can be either commited or rolled back, and Eventstore will handle concurrent writes by retrying the write a preset number of times (before otherwise failing the transaction/batch).

## Queries and multiple models
You can design multiple different models to use when working with your event log. These models can be thought of as similar to views or even queries in a SQL database. Eventstore is designed to work with multiple models over the same store. These different models will allow you to view your data in different ways, or even work with them.

[Check out the super handy "Patterns for creating a model from the eventlog"](./patterns.md)

## Replaying the event log
You can also replay all events in the event log to aggregate data without creating a model upfront.

## Snapshots
One advantage of creating a model is the ability to create a snapshot. A snapshot is a 
precomputed state of the model at a given time (ie. at a specific log no.) With this snapshot, you can easily skip the replaying of parts of (or even the whole of) the log, thus making restoring a model consume fewer resources.

If you create multiple models, you will get seperate snapshots for each model. (Snapshots can't shared between models.)

## LogSchemaTool
The `LogSchemaTool` is an analyzer tool for your event logs.
It looks at a set of logs to determine what events it holds. It will show number of occurrences, the parameter names and types, as well as the first and last appearances of that event.

The `LogSchemaTool` was created to help create new models, but the information gathered and reported could also be helpful to determine when certain functionality was implemented, indicating periods of time when certain events would or wouldn't have been recorded, thus showing what data potentially is missing.

The `LogSchemaTool` is implemented as a read only domain model.

```javascript
//TODO: show code to use the LogSchemaTool...
```

## Simple to setup
__Eventstore__ requires you to include its NPM package in your code, and runs in process. There is no need to set up or run a server process.

Most document databases or relational databases products will typically require the installation of a server process.

Going directly to the filesystem is perhaps the simplest to set up, but you have no abstractions to handle concurrency nor transactions and more.

### Speed

My initial simple comparissons show that with a workload of 15K transactions with each about 10 modifications in each and affecting a total of about 10K rows of data, EventStore on node.js will run about two times slower than C# against MS SQL Server.

Replaying the event log through the log aggregator so that you can query the data with the _domain model_ is slower than working with data in SQL Server tables. Writing to the event log is about the same speed (or possibly faster) than inserting or modifying rows in the SQL Server tables.

//TODO: Create comprehensive table of more test results from different types of workloads.

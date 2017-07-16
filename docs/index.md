
## Current status

[![Build Status](https://travis-ci.org/scriptabuild/eventstore.svg?branch=master)](https://travis-ci.org/scriptabuild/eventstore)

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

Eventsourcing is described quite well by in [this article by Martin Fowler](https://martinfowler.com/eaaDev/EventSourcing.html).

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

## Main functionality of @aeinbu/eventsource

- Transactional batches. A batch either runs to completion and is then committed and stored. If the batch fails or for other reasons is aborted, the state is rolled back to the state at the beginning of the batch operation. (Ie. a batch is either fully completed, or not recorded at all.)
- Repeatable read isolation level.
- Will retry concurrent batches.
- All events to the eventstore will end up having an order, so that replay always will give the same result.

@aeinbu/eventstore offers repeateble read isolation level with the transaction/batch model. These transactions can be either commited or rolled back, and @aeinbu/eventstore will handle concurrent writes by retrying the write a preset number of times (before otherwise failing the transaction/batch).

[Check out the tutorial to get started.](./tutorial.md)

For even further reading, you coud also go to [the important documentation for the "defineStore"](./defineStore.md) or
[the really not so important documentation for "EventStore" class](./EventStore.md)

## What doesn't it do?

//TODO: Surely there must be something, mustn't it?

## Built-in audit log trail

//TODO:

## Read/write models vs. Read models

A read/write model allows you to work with existing data in an eventlog in a persisent way. Any changes made through the model are stored to the eventlog as an ordered and transactional item.

A read model allows you to work with a model created by replaying the event logs. Any changes made to a read only model will be lost when the model is "closed".

## Transactional

//TODO:

## Queries and multiple models

You can design multiple different models to use when working with your event log. These models can be thought of as similar to views or even queries in a SQL database. @aeinbu/eventstore is designed to work with multiple models over the same store. These different models will allow you to view your data in different ways, or even work with them.

[Check out the super handy "Patterns for creating a model from the eventlog"](./patterns.md)

## Replaying the event log

You can also replay all events in the event log to aggregate data without creating a model upfront.

## Snapshots

One advantage of creating a model is the ability to create a snapshot. A snapshot is a 
precomputed state of the model at a given time (ie. at a specific log no.) With this snapshot, you can easily skip the replaying of parts of (or even the whole of) the log, thus making restoring a model consume fewer resources.

If you create multiple models, you will get seperate snapshots for each model. (Snapshots can't shared between models.)

//TODO:

Historical models/future models (Is this from the M.Fowler article???)

## LogSchemaTool

The `LogSchemaTool` is an analyzer tool for your event logs.
It looks at a set of logs to determine what events it holds. It will show number of occurrences, the parameter names and types, as well as the first and last appearances of that event.

The `LogSchemaTool` was created to help create new models, but the information gathered and reported could also be helpful to determine when certain functionality was implemented, indicating periods of time when certain events would or wouldn't have been recorded, thus showing what data potentially is missing.

The `LogSchemaTool` is implemented as any other query model.

## Compared to other storage strategies

//TODO:

Concurrency
Transactions
Speed

SQL Database or RDBMS (Relational DataBase Management System) like MS SQL Server, SqlLite, DB2, Oracle, Sybase, MySQL etc.
Files and folders
Document DBs

Simplicity
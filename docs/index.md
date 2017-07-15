# @aeinbu/eventstore

## Pretext

In the classical main-stream architecture the applications we design and build
are stateful. This means that we always store a snapshot of the objects we deal
with in our application in a data store. The snapshot represents the state of
the object after the last modification. We continuously overwrite the previous
state or snapshot with the newest version in the data store, since there at any
one time can be only one version. In doing so, we lose the historical content
of the older versions.

For many kinds of data or content this might be more than sufficient since we
are not really interested in what was before and how we did get to the point we
currently are.

## So, what is Eventsourcing?

Eventsourcing is described quite well by in [this article by Martin Fowler](https://martinfowler.com/eaaDev/EventSourcing.html).

Instead of storing and updating the store to always show a view of the data at
some point in time, eventsourcing lets you keep all the changes to the database.

The intentions for an event are stored.

This audit trail of operations (while to some degree similar to an RDBMS' transactionlog) allows restoring the data to any point in time (as long as the log files are kept.)

One important differenting feature of the eventlog vs. the transactionlog (of an RDBMS) is in the way the log intentionally is made accessable to us, as opposed to with a database transaction log who only concerns are to ensure integrity of the database, and the ability to rollback a transaction.

Intentions for an event are stored with the event, for a transactionlog entry the real intention is lost.

Replay is a important key feature to the entire eventsourcing system.

As replay is used everytime you need to inflate a model to query, you'll get more used to dealing with events and playing back the log. Replay has to be a very easy feature to use.

Some of the new habits of working with the eventsource will be:
- Doing multiple replays.
- Repeating a replay and stop where you want in that replay; Either by looking at header data (like the logged time) or the state of the model you're replaying to.


## Main functionality

- Transactional batches. A batch either runs to completion and is then committed and stored. If the batch fails or for other reasons is aborted, the state is rolled back to the state at the beginning of the batch operation. (Ie. a batch is either fully completed, or not recorded at all.)
- Repeatable read isolation level.
- Will retry concurrent batches.
- All events to the eventstore will end up having an order, so that replay always will give the same result0.

@aeinbu/eventstore offers repeateble read isolation level with the transaction/batch model. These transactions can be either commited or rolled back, and @aeinbu/eventstore will handle concurrent writes by retrying the write a preset number of times (before otherwise failing the transaction/batch).


## What doesn't it do?

//TODO:

## Built-in audit log trail

//TODO:

## Replay

//TODO:

## Transaction

//TODO:

## Queries and multiple models

//TODO:

### `LogSchemaTool`

`LogSchemaTool` looks at a set of logs to determine what events it holds. It will show number of occurrences, as well as the first and last appearances of that event.

The `LogSchemaTool` is implemented as any other query model.

This should be helpfull to determine when certain functionality was implemented, indicating when certain events would not have been recorded, thus showing what data potentially is missing.

## Snapshots

//TODO:

Multiple readmodels
Historical models/future models

## Read models vs. ReadWrite models vs. writer vs. replay logs

## Compared to other storage strategies

//TODO:

Concurrency
Transactions
Speed

RDBMs
Files
Document DBs

Simplicity
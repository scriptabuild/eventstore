# defineStore
## defineStore(folder, options)


## log(eventObj)

Allows writing an event to the eventlog without defining a model. This is for all practical purposes the write-only mode.

## logBlock(action)

Allows writing an event to the eventlog without defining a model. This is for all practical purposes the write-only mode.

## replayEventStream(handleEvents)

Allows streaming (and reading) all event in the eventlog without defining a model.

## defineModel(modelDefinition)

Returns a model object that...

//TODO:

# methods on the model returned from `defineModel`

## snapshot()

Saves a snapshot of the current state

## withReadInstance(action)

Creates a read instance of the model. Atempts to change the model inside here will not store the events to the eventstore.

## withReadWriteInstance(action, maxRetries)

Creates a read/write instance of the model. Any events fired on the model inside here will be stored to the eventstore.



# Getting started with EventStore

You will need to create 3 items. A class for your _domain model_, a class for your _storage model_ and an object defining _how to initialize_ the models.

## The Domain Model
DomainModel: class
- constructor(dispatch: function, storeModel: any)
	- dispatch(eventName: string, eventData: any))

The DomainModel has methods on it to "do the business".
In these methods, call dispatch(...) to store to eventSource and StoreModel(s)

## The Storage Model
StoreModel: class
- constructor(snapshotData: any)
- this.snapshotConfiguration: object
	- areSnapshotsEnabled: bool
	- snapshotName: string
	- createSnapshotData(): any
- this.eventHandlers: object
	- onSomethingHappened(eventdata: any)

## The object defining how to initialize the models
modelDefinition: object
- getSnapshotConfiguration(storeModel: object): object
- getEventHandlers(storeModel: object): object
- createStoreModel(snapshotData: any): any
- createDomainModel(dispatch: function, storeModel: object)


# How to...???

defineStore(folder: string, options: object)
- defineModel(modelDefinition: object)
	- snapshot()
	- withReadInstance(action(instance: domainModel))
	- withReadWriteInstance(action(instance: domainModel, readyToCommit()), maxRetries: number)



dispatching
- method is called on domainModel
- domainModel dispatches by
	- store in eventStore
	- handle in storeModel (eventHandlers)


# API Documentation

## defineStore
``` javascript
let storeBase = defineStore(folder)
```
Sets up a folder as a database. Is the b`se for creating models on that folder.

## defineReadModel
_store_.defineReadModel(_create-readmodel-function_)
``` javascript
storeBase.defineReadModel(action)
```

## defineReadWriteModel
await _store_.defineReadWriteModel(_create-readwritemodel-function_)
``` javascript
storeBase.defineReadWriteModel(action, commitCallback)
```


## defineWriteModel
__NOT IMPLEMENTED YET__
``` javascript
storeBase.defineWriteModel()
```

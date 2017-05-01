# Patterns for creating a model from the eventlog
When building a model from events

## Add something to an array
- Keep all occurrences of an item
``` javascript
model.push(eventdata.item)
```

## Set (or add) a key to an object
- Add or modify
- Add or replace
- Only add: same as keep first. (Consider if you should throw an exception if exists)
``` javascript
model.id = eventdata.id;
```

``` javascript
// create the key with a name from the item
model[eventdata.item.keycomponent] = eventdata.item;
```

``` javascript
// run a function to create the key name
const fullname = item => `${item.firstname} ${item.lastname}`;
model[fullname(eventdata)] = eventdata.item;
```

## Keep the first occurrence of an item
- Only add, not replace
``` javascript
// check if item exists
// add if it doesnt exists in the collection
// example for object keys and for array elements
```

## Keep the latest occurrence of an item
- Always replace the item in the model with content from the event
- Same as add or replace
- Modify
``` javascript
// for objects keys:
// add or replace key
```

``` javascript
// for arrays:
// iterate through the array to find the item (foreach, find, indexOf etc.)
// if found: replace at the found index
// if not found: push to end of array
```

## Modify an item on the model

``` javascript
// for objects keys:
// add or replace key
```

## Aggregate all occurrences of items (.reduce)

``` javascript
// ???
```

## Remove data from model

``` javascript
// for objects keys:
delete key;
```

``` javascript
// for array elements:
// iterate through the array to find the item (foreach, find, indexOf etc.)
// if found: replace at the found index
```

## Run any custom javascript code
- The model is just plain javascript, so modify the above examples at will to run arbitrary code

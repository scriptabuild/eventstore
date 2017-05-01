# Patterns for creating a model from the eventlog
With @aeinbu/eventstore, the model is created using javascript.
This document lists some "how-to" patterns to help create a model from events.

## Working with arrays

### Add an item to an array
When you want to keep all occurrences of items, and store them in an unkeyed collection (ie. array),
just push or shift them onto the array.

``` javascript
array.push(eventdata.item);
```
``` javascript
array.shift(eventdata.item);
```

### Locate an item in the array
You have a few choices to find an item or an index in an array.

For finding the position (or index), the easiest ways are to use `let index = array.indexOf(item)` or `let index = array.findIndex(compareCallback)`.
If you need to retrieve the actual element in an array, use `let itemFromArray = array.find(compareCallback)`.

You'll see these same approaches used in the patterns below.

### Keep only the first occurrence of an item
When you want to keep only the first occurrence of an item, (ie. ignoring repeats), you'll need to
find if the item is an element of the the array. If it doesn't, you can add the item.

``` javascript
let index = array.indexOf(item);	// when item is a primitive type you can use .indexOf to find the index of an element
if(index === -1) {
	array.push(item);
}
```

``` javascript
let index = array.findIndex(item => item.serialnumber = model.serialnumber);	// when item is a complex, you're in charge of writing the comparer to use with .findIndex.
if(index === -1) {
	array.push(item);
}
```

### Remove an item from an array
When you want to remove an occurrence of an item from the array, you'll need to find the items position (index) in
the array. Use the position (index) and remove the element at that position.

``` javascript
let index = array.indexOf(item);	// when item is a primitive type you can use .indexOf to find the index of an element
if(index !== -1) {
	array.splice(inde, 1, ...array.slice(ix + 1));
}
```

``` javascript
let index = array.findIndex(item => item.serialnumber = model.serialnumber);	// when item is a complex, you're in charge of writing the comparer to use with .findIndex.
if(index !== -1) {
	array.splice(index, 1, ...array.slice(ix + 1));
}
```





## Working with objects
- dictionary
- same patterns apply to working with `Map` and `WeakMap`

### Add or replace a property to an object
- Set
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

### Keep only the first occurrence of an item
- Only add, not replace
``` javascript
// check if item exists
// add if it doesnt exists in the collection
// example for object keys and for array elements
```

### Keep only the latest occurrence of an item
- Always replace the item in the model with content from the event
- Same as add or replace
- Modify
- When you want to Modify an item on the model

``` javascript
// for objects keys:
// add or replace key
```

### Remove a property from an object
- delete
- remove

``` javascript
// for objects keys:
delete key;
```






### Aggregate all occurrences of items
- reduce
``` javascript
// ???
```

### Sets, Maps, WeakMapd


## Run any custom javascript code
- The model is just plain javascript, so modify the above examples at will to run arbitrary code

# Patterns for creating a model from the eventlog
With @aeinbu/eventstore, a model is created using javascript.
This document lists some "how-to" patterns to help create a model from events.

## Working with arrays
Arrays in Javascript are un-keyed, indexed collections. They are dynamically sized, so you can add or remove elements.

Other un-keyed collection types in Javascript include `Set` and `WeakSet`.

Set model to be an empty array like this:
``` javascript
let model = [];
```


### Add an item to an array
When you want to keep all occurrences of items, and store them in an unkeyed collection (ie. array),
just push or shift them onto the array.

``` javascript
model.push(eventdata.item);		// adds it at the end of the array
```
``` javascript
model.shift(eventdata.item);	// adds it at the beginning of the array
```

### Locate an item in the array
You have a few choices to find an item or an index in an array.

For finding the position (or index), the easiest ways are to use `let index = model.indexOf(item)` or `let index = model.findIndex(compareCallback)`.
If you need to retrieve the actual element in an array, use `let itemFromArray = model.find(compareCallback)`.

You'll see these same approaches used in the patterns below.

### Keep only the first occurrence of an item
When you want to keep only the first occurrence of an item, (ie. ignoring repeats), you'll need to
find if the item is an element of the the array. If it doesn't, you can add the item.

``` javascript
let index = model.indexOf(eventdata.item);	// when item is a primitive type you can use .indexOf to find the index of an element
if(index === -1) {
	model.push(eventdata.item);
}
```

``` javascript
let index = model.findIndex(item => item.serialnumber = model.serialnumber);	// when item is a complex, you're in charge of writing the comparer to use with .findIndex.
if(index === -1) {
	model.push(item);
}
```

An alternative approach would be to use a `Set` instead of an array, since sets won't allow holding duplicate values.

### Remove an item from an array
When you want to remove an occurrence of an item from the array, you'll need to find the items position (index) in
the array. Use the position (index) and remove the element at that position.

``` javascript
let index = model.indexOf(item);	// when item is a primitive type you can use .indexOf to find the index of an element
if(index !== -1) {
	model.splice(index, 1, ...model.slice(ix + 1));
}
```

``` javascript
let index = array.findIndex(item => item.serialnumber = model.serialnumber);	// when item is a complex, you're in charge of writing the comparer to use with .findIndex.
if(index !== -1) {
	model.splice(index, 1, ...model.slice(ix + 1));
}
```






## Working with objects
Objects in Javascript are keyed collections or dictionaries. That is a collections of elements with an associated string key.
You add elements at a given key, and retrieve them with the same key.

Other dictionary types in Javascript are `Map` and `WeakMap`.

Set model to be an empty object like this:
``` javascript
let model = {};
```

### Add or replace a property on an object
When you want to keep all occurrences of items, and store them in a keyed collection (ie. object),
just set the property with the key as name.

`model.keyname` and `model["keyname"]` are equivalent, but the latter allows to use an expression retuning a string to represent the key.

``` javascript
// create the key with a name from the item
model[eventdata.keycomponent] = eventdata.item;
```

``` javascript
// run a function to create the key name
const fullname = item => `${item.firstname} ${item.lastname}`;
model[fullname(eventdata)] = eventdata.item;
```

### Keep only the first occurrence of an item
When you want to keep only the first occurrence of an keyed item, (ie. ignoring repeats), you'll need to
find if the item's key is a property of the the object. If it isn't, you can add the item as the desired property.

``` javascript
if(model[eventdata.keycomponent] === undefined){
	model[eventdata.keycomponent] = eventdata.item;
}
```

### Keep only the latest occurrence of an item
When you want to keep the latest occurrence of a keyed item, you should set the property to the item every time the
item occurs. (In the same way as when first adding the key. See "add or replace a property on an object" above.)

### Remove a property from an object
When you want to remove an keyed item from the object, you can just `delete` that property.

``` javascript
delete model[eventdata.keycomponent];
```



---


### Aggregate all occurrences of items
- reduce
- sample code to count occurrences
- ??? sample code for ???
``` javascript
// ???
```

### Sets, Maps, WeakMap etc.


## Run any custom javascript code
- The model is just plain javascript, so modify the above examples at will to run arbitrary code

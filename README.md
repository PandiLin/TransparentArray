# TransparentArray

Most of the complex iteration and data modification is relying on array modification,
when we want to debug or to understand the data flow, we always need to use console.log on a lot of different middle steps,

but what if we can use a custom array to which just log the every access, modifications, construction of the array?
perhaps it can be a handy tool to understand the data flow and the state of the array.



TransparentArray is a custom array implementation in TypeScript that provides transparency into array operations. It extends the native Array class and uses RxJS Subjects to emit messages about array modifications and accesses.

## Features

- Extends the native JavaScript Array
- Tracks array modifications and accesses
- Uses RxJS Subjects for event emission
- Supports common array operations (push, pop, splice, etc.)
- Provides a pretty-print function for logging array operations

## Usage

### DEBUG USING CONSOLE
```typescript
import { TransparentArray, prettyPrint } from './TransparentArray';

function createFibArray(n: number, arr: number[]): number[]{
  if (n <= 0) {
    throw new Error("The input number must be greater than 0");
  }

  for (let i = 0; i < n; i++) {
    if (i <= 1) {
      arr.push(i);
    } else {
      arr.push(arr[i - 1] + arr[i - 2]);
    }
  }
  
  return arr;
}


console.log(createFibArray(10, []));

### CONSOLE:
[ 0, 1, 1, 2, 3, 5, 8, 13, 21, 34 ]


createFibArray(10, TransparentArray(prettyPrint));

### CONSOLE:
Type: NEW Method: constructor Args: [[]] Array: []
Type: MODIFY Method: index Args: ["0",0] Array: [0]
Type: MODIFY Method: push Args: [0] Array: [0, 0]
Type: MODIFY Method: index Args: ["1",1] Array: [0, 1]
Type: MODIFY Method: push Args: [1] Array: [0, 1, 1]
Type: ACCESS Method: index Args: ["1"] Array: [0, 1, 1]
Type: ACCESS Method: index Args: ["0"] Array: [0, 1, 1]
Type: MODIFY Method: index Args: ["2",1] Array: [0, 1, 1]
Type: MODIFY Method: push Args: [1] Array: [0, 1, 1, 1]
Type: ACCESS Method: index Args: ["2"] Array: [0, 1, 1, 1]
Type: ACCESS Method: index Args: ["1"] Array: [0, 1, 1, 1]
Type: MODIFY Method: index Args: ["3",2] Array: [0, 1, 1, 2]
Type: MODIFY Method: push Args: [2] Array: [0, 1, 1, 2, 2]
Type: ACCESS Method: index Args: ["3"] Array: [0, 1, 1, 2, 2]
Type: ACCESS Method: index Args: ["2"] Array: [0, 1, 1, 2, 2]
Type: MODIFY Method: index Args: ["4",3] Array: [0, 1, 1, 2, 3]
Type: MODIFY Method: push Args: [3] Array: [0, 1, 1, 2, 3, 3]
Type: ACCESS Method: index Args: ["4"] Array: [0, 1, 1, 2, 3, 3]
Type: ACCESS Method: index Args: ["3"] Array: [0, 1, 1, 2, 3, 3]
Type: MODIFY Method: index Args: ["5",5] Array: [0, 1, 1, 2, 3, 5]
Type: MODIFY Method: push Args: [5] Array: [0, 1, 1, 2, 3, 5, 5]
Type: ACCESS Method: index Args: ["5"] Array: [0, 1, 1, 2, 3, 5, 5]
Type: ACCESS Method: index Args: ["4"] Array: [0, 1, 1, 2, 3, 5, 5]
Type: MODIFY Method: index Args: ["6",8] Array: [0, 1, 1, 2, 3, 5, 8]
Type: MODIFY Method: push Args: [8] Array: [0, 1, 1, 2, 3, 5, 8, 8]
Type: ACCESS Method: index Args: ["6"] Array: [0, 1, 1, 2, 3, 5, 8, 8]
Type: ACCESS Method: index Args: ["5"] Array: [0, 1, 1, 2, 3, 5, 8, 8]
Type: MODIFY Method: index Args: ["7",13] Array: [0, 1, 1, 2, 3, 5, 8, 13]
Type: MODIFY Method: push Args: [13] Array: [0, 1, 1, 2, 3, 5, 8, 13, 13]
Type: ACCESS Method: index Args: ["7"] Array: [0, 1, 1, 2, 3, 5, 8, 13, 13]
Type: ACCESS Method: index Args: ["6"] Array: [0, 1, 1, 2, 3, 5, 8, 13, 13]
Type: MODIFY Method: index Args: ["8",21] Array: [0, 1, 1, 2, 3, 5, 8, 13, 21]
Type: MODIFY Method: push Args: [21] Array: [0, 1, 1, 2, 3, 5, 8, 13, 21, 21]
Type: ACCESS Method: index Args: ["8"] Array: [0, 1, 1, 2, 3, 5, 8, 13, 21, 21]
Type: ACCESS Method: index Args: ["7"] Array: [0, 1, 1, 2, 3, 5, 8, 13, 21, 21]
Type: MODIFY Method: index Args: ["9",34] Array: [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
Type: MODIFY Method: push Args: [34] Array: [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 34]
```

```typescript
// filter out the access messages
// there will be some complaining from typescript, but compiler is always complaining, just ignore it
const filteredMessages = createFibArray(10, TransparentArray(prettyPrint))
  .pipe(filter((msg) => msg.type === MessageType.Access)
        prettyPrint)


### CONSOLE:
 Type: ACCESS Method: index Args: ["1"] Array: [0, 1, 1]
 Type: ACCESS Method: index Args: ["0"] Array: [0, 1, 1]
 Type: ACCESS Method: index Args: ["2"] Array: [0, 1, 1, 1]
 Type: ACCESS Method: index Args: ["1"] Array: [0, 1, 1, 1]
 Type: ACCESS Method: index Args: ["3"] Array: [0, 1, 1, 2, 2]
 Type: ACCESS Method: index Args: ["2"] Array: [0, 1, 1, 2, 2]
 Type: ACCESS Method: index Args: ["4"] Array: [0, 1, 1, 2, 3, 3]
 Type: ACCESS Method: index Args: ["3"] Array: [0, 1, 1, 2, 3, 3]
 Type: ACCESS Method: index Args: ["5"] Array: [0, 1, 1, 2, 3, 5, 5]
 Type: ACCESS Method: index Args: ["4"] Array: [0, 1, 1, 2, 3, 5, 5]
 Type: ACCESS Method: index Args: ["6"] Array: [0, 1, 1, 2, 3, 5, 8, 8]
 Type: ACCESS Method: index Args: ["5"] Array: [0, 1, 1, 2, 3, 5, 8, 8]
 Type: ACCESS Method: index Args: ["7"] Array: [0, 1, 1, 2, 3, 5, 8, 13, 13]
 Type: ACCESS Method: index Args: ["6"] Array: [0, 1, 1, 2, 3, 5, 8, 13, 13]
 Type: ACCESS Method: index Args: ["8"] Array: [0, 1, 1, 2, 3, 5, 8, 13, 21, 21]
 Type: ACCESS Method: index Args: ["7"] Array: [0, 1, 1, 2, 3, 5, 8, 13, 21, 21]
```



Install Package:
```bash
npm install transparent-array
```
or 

```bash
bun install transparent-array
```



To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.1.26. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

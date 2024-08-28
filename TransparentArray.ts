import  { Observable, ReplaySubject, Subject } from "rxjs";

enum MessageType {
  Access = "ACCESS",
  Modify = "MODIFY",
  New = "NEW",
}

class Message {
  readonly type: MessageType;
  readonly method: string;
  readonly args: any[];
  readonly array: any[];
  constructor(type: MessageType, method: string, args: any[], array: any[]) {
    this.type = type;
    this.method = method;
    this.args = args;
    this.array = array;
  }
}


export class TransparentArray<T> extends Array<T> {
  gatherer: Subject<Message> = new ReplaySubject();
  subscribe: (sub: Subject<Message>) => void;
  items: T[];
  constructor(subscribe: (sub: Subject<Message>) => void, ...items: T[]) {
    super(...items);
    Object.setPrototypeOf(this, TransparentArray.prototype);

    if (typeof subscribe !== 'function') {
      throw new Error('subscribe must be a function, not ' + typeof subscribe);
    }

    this.subscribe = subscribe;
    this.items = items;
    this.gatherer.next(new Message(MessageType.New, 'constructor', [this], [...this]));


    this.subscribe(this.gatherer);
    // Create and return a Proxy
    return new Proxy(this, {
      get: (target, prop, receiver) => {
        const value = Reflect.get(target, prop, receiver);
        if (typeof prop === 'string' && !isNaN(Number(prop))) {
          this.gatherer.next(new Message(MessageType.Access, 'index', [prop], [...this]));
        }
        return value;
      },
      set: (target, prop, value, receiver) => {
        const result = Reflect.set(target, prop, value, receiver);
        if (typeof prop === 'string' && !isNaN(Number(prop))) {
          this.gatherer.next(new Message(MessageType.Modify, 'index', [prop, value], [...this]));
        }
        return result;
      }
    });
  }

  // Modifying methods
  push(...items: T[]): number {
    const result = super.push(...items);
    this.gatherer.next(new Message(MessageType.Modify, 'push', items, [...this]));
    return result;
  }

  pop(): T | undefined {
    const item = super.pop();
    this.gatherer.next(new Message(MessageType.Modify, 'pop', [item], [...this]));
    return item;
  }

  shift(): T | undefined {
    const item = super.shift();
    this.gatherer.next(new Message(MessageType.Modify, 'shift', [item], [...this]));
    return item;
  }

  unshift(...items: T[]): number {
    const result = super.unshift(...items);
    this.gatherer.next(new Message(MessageType.Modify, 'unshift', items, [...this]));
    return result;
  }

  //@ts-ignore
  override splice(start: number, deleteCount?: number, ...items: T[]): TransparentArray<T> {
    const removed = super.splice(start, deleteCount || 0, ...items);
    this.gatherer.next(new Message(MessageType.Modify, 'splice', [start, deleteCount || 0, ...items], [...this]));
    return new TransparentArray(this.subscribe, ...removed);
  }

  // Add this method to make TransparentArray<T> assignable to T[]
  [Symbol.species]() {
    return Array;
  }

  // Accessor methods
  //@ts-ignore
  override slice(start?: number, end?: number): TransparentArray<T> {
    const result = new TransparentArray<T>(this.subscribe, ...super.slice(start, end));
    this.gatherer.next(new Message(MessageType.Access, 'slice', [start, end], [...this]));
    return result;
  }

  //@ts-ignore
  override concat(...items: (T | ConcatArray<T>)[]): TransparentArray<T> {
    const result = new TransparentArray(this.subscribe, ...super.concat(...items));
    this.gatherer.next(new Message(MessageType.Modify, 'concat', items, [...this]));
    return result;
  }
  // Iteration methods
  forEach(callbackfn: (value: T, index: number, array: T[]) => void): void {
    super.forEach(callbackfn);
    this.gatherer.next(new Message(MessageType.Access, 'forEach', [], [...this]));
  }

  //@ts-ignore
  map<U>(callbackfn: (value: T, index: number, array: T[]) => U): TransparentArray<U> {
    const result = construct_transparent_array(this.subscribe, this.items.map(callbackfn));
    this.gatherer.next(new Message(MessageType.Access, 'map', [], [...result]));
    return result;
  }

  //@ts-ignore
  filter(callbackfn: (value: T, index: number, array: T[]) => boolean): TransparentArray<T> {
    const result = new TransparentArray(this.subscribe, ...this.items.filter(callbackfn));
    this.gatherer.next(new Message(MessageType.Access, 'filter', [], [...result]));
    return result;
  }

  //@ts-ignore
  reduce<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U, initialValue: U): U {
    const result = this.items.reduce(callbackfn, initialValue);
    this.gatherer.next(new Message(MessageType.Access, 'reduce', [], [...this]));
    return result;
  }

  //@ts-ignore
  reduceRight<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U, initialValue: U): U {
    const result = this.items.reduceRight(callbackfn, initialValue);
    this.gatherer.next(new Message(MessageType.Access, 'reduceRight', [], [...this]));
    return result;
  }

  // Searching and sorting methods
  find(predicate: (value: T, index: number, obj: T[]) => boolean): T | undefined {
    const result = this.items.find(predicate);
    this.gatherer.next(new Message(MessageType.Access, 'find', [], [...this]));
    return result;
  }

  findIndex(predicate: (value: T, index: number, obj: T[]) => boolean): number {
    const result = this.items.findIndex(predicate);
    this.gatherer.next(new Message(MessageType.Access, 'findIndex', [], [...this]));
    return result;
  }

  indexOf(searchElement: T, fromIndex?: number): number {
    const result = this.items.indexOf(searchElement, fromIndex);
    this.gatherer.next(new Message(MessageType.Access, 'indexOf', [searchElement, fromIndex], [...this]));
    return result;
  }

  lastIndexOf(searchElement: T, fromIndex?: number): number {
    const result = this.items.lastIndexOf(searchElement, fromIndex);
    this.gatherer.next(new Message(MessageType.Access, 'lastIndexOf', [searchElement, fromIndex], [...this]));
    return result;
  }

  includes(searchElement: T, fromIndex?: number): boolean {
    const result = this.items.includes(searchElement, fromIndex);
    this.gatherer.next(new Message(MessageType.Access, 'includes', [searchElement, fromIndex], [...this]));
    return result;
  }

  sort(compareFn?: (a: T, b: T) => number): this {
    this.items.sort(compareFn);
    this.gatherer.next(new Message(MessageType.Modify, 'sort', [], [...this]));
    return this;
  }

  reverse(): T[] {
    this.items.reverse();
    this.gatherer.next(new Message(MessageType.Modify, 'reverse', [], [...this]));
    return [...this];
  }

  // Other utility methods
  join(separator?: string): string {
    const result = this.items.join(separator);
    this.gatherer.next(new Message(MessageType.Access, 'join', [separator], [...this]));
    return result;
  }

  toString(): string {
    const result = this.items.toString();
    this.gatherer.next(new Message(MessageType.Access, 'toString', [], [...this]));
    return result;
  }

  toLocaleString(): string {
    const result = this.items.toLocaleString();
    this.gatherer.next(new Message(MessageType.Access, 'toLocaleString', [], [...this]));
    return result;
  }

  // ES2015+ methods
  fill(value: T, start?: number, end?: number): this {
    this.items.fill(value, start, end);
    this.gatherer.next(new Message(MessageType.Modify, 'fill', [value, start, end], [...this]));
    return this;
  }

  copyWithin(target: number, start: number, end?: number): this {
    this.items.copyWithin(target, start, end);
    this.gatherer.next(new Message(MessageType.Modify, 'copyWithin', [target, start, end], [...this]));
    return this;
  }

  // ES2016+ methods
  //@ts-ignore
  every(predicate: (value: T, index: number, array: T[]) => boolean): boolean {
    const result = this.items.every(predicate);
    this.gatherer.next(new Message(MessageType.Access, 'every', [], [...this]));
    return result;
  }

  some(predicate: (value: T, index: number, array: T[]) => boolean): boolean {
    const result = this.items.some(predicate);
    this.gatherer.next(new Message(MessageType.Access, 'some', [], [...this]));
    return result;
  }

  // ES2019+ methods
  // @ts-ignore
  flat<D extends number = 1>(depth?: D): TransparentArray<FlatArray<T, D>> {
    const result = construct_transparent_array(this.subscribe, this.items.flat(depth));
    this.gatherer.next(new Message(MessageType.Access, 'flat', [depth], [...result]));
    return result;
  }

  // @ts-ignore
  flatMap<U, This = undefined>(
    callback: (this: This, value: T, index: number, array: T[]) => U | ReadonlyArray<U>,
    thisArg?: This
  ): TransparentArray<U> {
    const result = construct_transparent_array(this.subscribe, this.items.flatMap(callback, thisArg));
    this.gatherer.next(new Message(MessageType.Access, 'flatMap', [], [...result]));
    return result;
  }
}

export function construct_transparent_array(subscribe: (sub: Subject<Message>) => void, items: any[]) {
  return new TransparentArray(subscribe, ...items);
}

function removeAllItem(item: any, array: TransparentArray<any>) {
  return array.filter((i, index, arr) => i !== item);
}

function prettyPrint(sub: Subject<Message>) {
  const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
  };

  function colorize(text: string, color: keyof typeof colors): string {
    return `${colors[color]}${text}${colors.reset}`;
  }

  sub.subscribe({
    next: (msg) => {
      console.log(`${colorize('Type:', 'cyan')} ${colorize(msg.type, 'yellow')} ${colorize('Method:', 'cyan')} ${colorize(msg.method, 'green')} ${colorize('Args:', 'cyan')} ${JSON.stringify(msg.args)} ${colorize('Array:', 'cyan')} [${msg.array.join(', ')}]`);
    }
  });
}

const test = construct_transparent_array(sub => {
  prettyPrint(sub);
}, [1, 2, 3, 4, 5, 4, 4, 4, 6, 7, 8, 9, 10]); 

removeAllItem(4, test);
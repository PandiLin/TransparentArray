import  { filter, Observable, ReplaySubject, Subject } from "rxjs";

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

    return new Proxy(this, {
      get: (target, prop, receiver) => {
        const value = Reflect.get(target, prop, receiver);
        if (typeof prop === 'string' && !isNaN(Number(prop))) {
          this.gatherer.next(new Message(MessageType.Access, 'index', [prop], this.items));
        }
        return value;
      },
      set: (target, prop, value, receiver) => {
        const result = Reflect.set(target, prop, value, receiver);
        if (typeof prop === 'string' && !isNaN(Number(prop))) {
          this.items[Number(prop)] = value; // Update the items array
          this.gatherer.next(new Message(MessageType.Modify, 'index', [prop, value], this.items));
        }
        return result;
      }
    });
  }

  // Override push method to update items array
  push(...items: T[]): number {
    const result = super.push(...items);
    this.items.push(...items);
    this.gatherer.next(new Message(MessageType.Modify, 'push', items, this.items));
    return result;
  }

  pop(): T | undefined {
    const item = this.items.pop();
    this.gatherer.next(new Message(MessageType.Modify, 'pop', [item], this.items));
    return item;
  }

  shift(): T | undefined {
    const item = this.items.shift();
    this.gatherer.next(new Message(MessageType.Modify, 'shift', [item], this.items));
    return item;
  }

  unshift(...items: T[]): number {
    const result = this.items.unshift(...items);
    this.gatherer.next(new Message(MessageType.Modify, 'unshift', items, this.items));
    return result;
  }

  //@ts-ignore
  override splice(start: number, deleteCount?: number, ...items: T[]): TransparentArray<T> {
    const removed = this.items.splice(start, deleteCount || 0, ...items);
    this.gatherer.next(new Message(MessageType.Modify, 'splice', [start, deleteCount || 0, ...items], this.items));
    return new TransparentArray(this.subscribe, ...removed);
  }

  // Add this method to make TransparentArray<T> assignable to T[]
  [Symbol.species]() {
    return Array;
  }

  // Accessor methods
  //@ts-ignore
  override slice(start?: number, end?: number): TransparentArray<T> {

    const result = new TransparentArray<T>(this.subscribe, ...this.items.slice(start, end));
    this.gatherer.next(new Message(MessageType.Access, 'slice', [start, end], this.items));
    return result;
  }

  //@ts-ignore
  override concat(...items: (T | ConcatArray<T>)[]): TransparentArray<T> {
    const result = new TransparentArray(this.subscribe, ...this.items.concat(...items));
    this.gatherer.next(new Message(MessageType.Modify, 'concat', items, this.items));
    return result;
  }
  // Iteration methods
  forEach(callbackfn: (value: T, index: number, array: T[]) => void): void {
    super.forEach(callbackfn);
    this.gatherer.next(new Message(MessageType.Access, 'forEach', [], this.items));
  }

  //@ts-ignore
  map<U>(callbackfn: (value: T, index: number, array: T[]) => U): TransparentArray<U> {
    const result = new TransparentArray(this.subscribe, ...this.items.map(callbackfn));
    this.gatherer.next(new Message(MessageType.Access, 'map', [], this.items));
    return result;
  }

  //@ts-ignore
  filter(callbackfn: (value: T, index: number, array: T[]) => boolean): TransparentArray<T> {
    const result = new TransparentArray(this.subscribe, ...this.items.filter(callbackfn));
    this.gatherer.next(new Message(MessageType.Access, 'filter', [], this.items));
    return result;
  }

  //@ts-ignore
  reduce<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U, initialValue: U): U {
    const result = this.items.reduce(callbackfn, initialValue);
    this.gatherer.next(new Message(MessageType.Access, 'reduce', [], this.items));
    return result;
  }

  //@ts-ignore
  reduceRight<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U, initialValue: U): U {
    const result = this.items.reduceRight(callbackfn, initialValue);
    this.gatherer.next(new Message(MessageType.Access, 'reduceRight', [], this.items));
    return result;
  }

  // Searching and sorting methods
  find(predicate: (value: T, index: number, obj: T[]) => boolean): T | undefined {
    const result = this.items.find(predicate);
    this.gatherer.next(new Message(MessageType.Access, 'find', [], this.items));
    return result;
  }
  findIndex(predicate: (value: T, index: number, obj: T[]) => boolean): number {
    const result = this.items.findIndex(predicate);
    this.gatherer.next(new Message(MessageType.Access, 'findIndex', [], this.items));
    return result;
  }

  indexOf(searchElement: T, fromIndex?: number): number {
    const result = this.items.indexOf(searchElement, fromIndex);
    this.gatherer.next(new Message(MessageType.Access, 'indexOf', [searchElement, fromIndex], this.items));
    return result;
  }

  lastIndexOf(searchElement: T, fromIndex?: number): number {
    const result = this.items.lastIndexOf(searchElement, fromIndex);
    this.gatherer.next(new Message(MessageType.Access, 'lastIndexOf', [searchElement, fromIndex], this.items));
    return result;
  }

  includes(searchElement: T, fromIndex?: number): boolean {
    const result = this.items.includes(searchElement, fromIndex);
    this.gatherer.next(new Message(MessageType.Access, 'includes', [searchElement, fromIndex], this.items));
    return result;
  }

  sort(compareFn?: (a: T, b: T) => number): this {
    this.items.sort(compareFn);
    this.gatherer.next(new Message(MessageType.Modify, 'sort', [], this.items));
    return this;
  }

  //@ts-ignore
  reverse(): TransparentArray<T> {
    this.items.reverse();
    this.gatherer.next(new Message(MessageType.Modify, 'reverse', [], this.items));
    
    return new TransparentArray(this.subscribe, ...this.items);
  }

  // Other utility methods
  join(separator?: string): string {
    const result = this.items.join(separator);
    return result;
  }

  toString(): string {
    const result = this.items.toString();
    this.gatherer.next(new Message(MessageType.Access, 'toString', [], this.items));
    return result;
  }

  toLocaleString(): string {
    const result = this.items.toLocaleString();
    this.gatherer.next(new Message(MessageType.Access, 'toLocaleString', [], this.items));
    return result;
  }

  // ES2015+ methods
  fill(value: T, start?: number, end?: number): this {
    this.items.fill(value, start, end);
    this.gatherer.next(new Message(MessageType.Modify, 'fill', [value, start, end], this.items));
    return this;
  }

  copyWithin(target: number, start: number, end?: number): this {
    this.items.copyWithin(target, start, end);
    this.gatherer.next(new Message(MessageType.Modify, 'copyWithin', [target, start, end], this.items));
    return this;
  }

  // ES2016+ methods
  //@ts-ignore
  every(predicate: (value: T, index: number, array: T[]) => boolean): boolean {
    const result = this.items.every(predicate);
    this.gatherer.next(new Message(MessageType.Access, 'every', [], this.items));
    return result;
  }

  some(predicate: (value: T, index: number, array: T[]) => boolean): boolean {
    const result = this.items.some(predicate);
    this.gatherer.next(new Message(MessageType.Access, 'some', [], this.items));
    return result;
  }

  // ES2019+ methods
  // @ts-ignore
  flat<D extends number = 1>(depth?: D): TransparentArray<FlatArray<T, D>> {
    const result = construct_transparent_array(this.subscribe, this.items.flat(depth));
    this.gatherer.next(new Message(MessageType.Access, 'flat', [depth], this.items));
    return result;
  }

  // @ts-ignore
  flatMap<U, This = undefined>(
    callback: (this: This, value: T, index: number, array: T[]) => U | ReadonlyArray<U>,
    thisArg?: This
  ): TransparentArray<U> {
    const result = construct_transparent_array(this.subscribe, this.items.flatMap(callback, thisArg));
    this.gatherer.next(new Message(MessageType.Access, 'flatMap', [], this.items));
    return result;
  }
}

export function construct_transparent_array(subscribe: (sub: Subject<Message>) => void, items: any[]) {
  return new TransparentArray(subscribe, ...items);
}




export function prettyPrint(sub: Subject<Message>) {
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


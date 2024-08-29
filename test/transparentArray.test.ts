import { expect, test, describe } from "bun:test";
import { TransparentArray, construct_transparent_array } from "../TransparentArray";
import { Subject } from "rxjs";
import { beforeEach } from "bun:test";

describe("TransparentArray", () => {
  let messages: any[] = [];
  const mockSubscribe = (sub: Subject<any>) => {
    sub.subscribe({
      next: (msg) => messages.push(msg)
    });
  };

  beforeEach(() => {
    messages = [];
  });

  test("constructor", () => {
    const arr = new TransparentArray(mockSubscribe, 1, 2, 3);
    expect(arr).toBeInstanceOf(TransparentArray);
    expect(arr.items).toEqual([1, 2, 3]);
    expect(messages.length).toBe(1);
    expect(messages[0].type).toBe("NEW");
    expect(messages[0].method).toBe("constructor");
  });

  test("push", () => {
    const arr = new TransparentArray(mockSubscribe, 1, 2);
    arr.push(3, 4);
    expect(arr.items).toEqual([1, 2, 3, 4]);
    console.log(messages);
    expect(messages[1].type).toBe("MODIFY");
    expect(messages[1].method).toBe("push");
  });

  test("pop", () => {
    const arr = new TransparentArray(mockSubscribe, 1, 2, 3);
    const popped = arr.pop();
    expect(popped).toBe(3);

    expect(arr.items).toEqual([1, 2]);
    expect(messages[1].type).toBe("MODIFY");
    expect(messages[1].method).toBe("pop");
  });

  test("shift", () => {
    const arr = new TransparentArray(mockSubscribe, 1, 2, 3);
    const shifted = arr.shift();
    expect(shifted).toBe(1);
    expect(arr.items).toEqual([2, 3]);
    expect(messages[1].type).toBe("MODIFY");
    expect(messages[1].method).toBe("shift");
  });

  test("unshift", () => {
    const arr = new TransparentArray(mockSubscribe, 2, 3);
    arr.unshift(0, 1);
    expect(arr.items).toEqual([0, 1, 2, 3]);
    expect(messages[1].type).toBe("MODIFY");
    expect(messages[1].method).toBe("unshift");
  });

  test("splice", () => {
    const arr = new TransparentArray(mockSubscribe, 1, 2, 3, 4);
    const removed = arr.splice(1, 2, 5, 6);
    expect(arr.items).toEqual([1, 5, 6, 4]);
    expect(removed).toBeInstanceOf(TransparentArray);
    expect(removed.items).toEqual([2, 3]);
    expect(messages[1].type).toBe("MODIFY");
    expect(messages[1].method).toBe("splice");
  });

  test("slice", () => {
    const arr = new TransparentArray(mockSubscribe, 1, 2, 3, 4);
    const sliced = arr.slice(1, 3);
    expect(sliced).toBeInstanceOf(TransparentArray);
    expect(sliced.items).toEqual([2, 3]);

    expect(messages[2].type).toBe("ACCESS");
    expect(messages[2].method).toBe("slice");
  });

  test("concat", () => {
    const arr1 = new TransparentArray(mockSubscribe, 1, 2);
    const arr2 = [3, 4];
    const result = arr1.concat(arr2);
    expect(result).toBeInstanceOf(TransparentArray);
    expect(result.items).toEqual([1, 2, 3, 4]);
    expect(messages[2].type).toBe("MODIFY");
    expect(messages[2].method).toBe("concat");
  });

  test("map", () => {
    const arr = new TransparentArray(mockSubscribe, 1, 2, 3);
    const mapped = arr.map(x => x * 2);
    expect(mapped).toBeInstanceOf(TransparentArray);
    expect(mapped.items).toEqual([2, 4, 6]);
    expect(messages[2].type).toBe("ACCESS");
    expect(messages[2].method).toBe("map");
  });

  test("filter", () => {
    const arr = new TransparentArray(mockSubscribe, 1, 2, 3, 4);
    const filtered = arr.filter(x => x % 2 === 0);
    expect(filtered).toBeInstanceOf(TransparentArray);
    expect(filtered.items).toEqual([2, 4]);
    expect(messages[2].type).toBe("ACCESS");
    expect(messages[2].method).toBe("filter");
  });

  test("construct_transparent_array", () => {
    const arr = construct_transparent_array(mockSubscribe, [1, 2, 3]);
    expect(arr).toBeInstanceOf(TransparentArray);
    expect(arr.items).toEqual([1, 2, 3]);
  });
});
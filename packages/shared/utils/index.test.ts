import { afterEach, expect, spyOn, test } from "bun:test";
import { P } from "./index";

let random: ReturnType<typeof spyOn<typeof Math, "random">> | undefined;

afterEach(() => {
    random?.mockRestore();
    random = undefined;
});

test("random ranges include the lower bound and stay below the upper bound", () => {
    random = spyOn(Math, "random");
    for (const [min, max] of [[3, 8], [-8, -3], [0.5, 1.5]] as const) {
        random.mockReturnValue(0);
        expect(P.Rand.range(min, max)).toBe(min);
        random.mockReturnValue(0.5);
        expect(P.Rand.range(min, max)).toBe((min + max) / 2);
        random.mockReturnValue(1 - Number.EPSILON);
        expect(P.Rand.range(min, max)).toBeGreaterThanOrEqual(min);
        expect(P.Rand.range(min, max)).toBeLessThan(max);
    }
    expect(P.Rand.range(4, 4)).toBe(4);
});

test("random integers respect both overloads and nonzero bounds", () => {
    random = spyOn(Math, "random");
    random.mockReturnValue(0);
    expect(P.Rand.int(5)).toBe(0);
    expect(P.Rand.int(3, 8)).toBe(3);
    expect(P.Rand.int(-8, -3)).toBe(-8);
    random.mockReturnValue(1 - Number.EPSILON);
    expect(P.Rand.int(5)).toBe(4);
    expect(P.Rand.int(3, 8)).toBe(7);
    expect(P.Rand.int(-8, -3)).toBe(-4);
});

test("RoundWhenClose converges to the exact fractional target", () => {
    expect(P.RoundWhenClose(1.2341, 1.2342)).toBe(1.2342);
    expect(P.RoundWhenClose(-1.2341, -1.2342, 3)).toBe(-1.2342);
    expect(P.RoundWhenClose(2.0001, 2)).toBe(2);
    expect(P.RoundWhenClose(1.2341, 1.24, 2)).toBe(1.2341);
    expect(P.RoundWhenClose(1.2341, 1.2342, 4)).toBe(1.2341);
});

test("inverse interpolation and mapping handle a zero-width source range", () => {
    for (const x of [4, 5, 6]) {
        expect(P.iLerp(x, 5, 5)).toBe(0);
        expect(P.iLerp(x, 5, 5, { clamp: true })).toBe(0);
        expect(P.map(x, 5, 5, 10, 20)).toBe(10);
        expect(P.map(x, 5, 5, 10, 20, { clamp: true })).toBe(10);
    }
});

test("inverse interpolation preserves reversed ranges, extrapolation and clamping", () => {
    expect(P.iLerp(3, 2, 6)).toBe(0.25);
    expect(P.iLerp(3, 6, 2)).toBe(0.75);
    expect(P.iLerp(8, 2, 6)).toBe(1.5);
    expect(P.iLerp(8, 2, 6, { clamp: true })).toBe(1);
    expect(P.iLerp(0, 2, 6, { clamp: true })).toBe(0);
    expect(P.map(8, 2, 6, 10, 20)).toBe(25);
    expect(P.map(8, 2, 6, 20, 10, { clamp: true })).toBe(10);
});

test("spliceNth rejects invalid steps without changing the array", () => {
    for (const nth of [0, -1, 0.5, 1.5, NaN, Infinity, -Infinity]) {
        const array = [1, 2, 3, 4];
        expect(() => P.Arr.spliceNth(array, nth)).toThrow();
        expect(array).toEqual([1, 2, 3, 4]);
    }
});

test("spliceNth removes elements in place starting at index zero", () => {
    const array = [1, 2, 3, 4, 5];
    expect(P.Arr.spliceNth(array, 2)).toEqual([1, 3, 5]);
    expect(array).toEqual([2, 4]);
    expect(P.Arr.spliceNth(array, 1)).toEqual([2, 4]);
    expect(array).toEqual([]);
    expect(P.Arr.spliceNth([], 2)).toEqual([]);
    const short = [1, 2];
    expect(P.Arr.spliceNth(short, 5)).toEqual([1]);
    expect(short).toEqual([2]);
});

test("isKeyOf accepts own keys even when their values are null or undefined", () => {
    const symbol = Symbol("key");
    const object = { missingValue: undefined, nullValue: null, zero: 0, disabled: false, empty: "", [symbol]: 1 };
    for (const key of ["missingValue", "nullValue", "zero", "disabled", "empty", symbol]) {
        expect(P.isKeyOf(object, key)).toBe(true);
    }
    expect(P.isKeyOf(object, "absent")).toBe(false);
});

test("isKeyOf excludes inherited keys and works without an object prototype", () => {
    expect(P.isKeyOf({}, "toString")).toBe(false);
    expect(P.isKeyOf({}, "constructor")).toBe(false);
    const object: Record<string, number> = Object.create(null);
    object.value = 1;
    expect(P.isKeyOf(object, "value")).toBe(true);
    expect(P.isKeyOf(object, "hasOwnProperty")).toBe(false);
});

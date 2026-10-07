import { gsap } from "../../gsap";

const Lerp = (xi: number, xf: number, t: number) => {
    return (1 - t) * xi + t * xf;
};

/** @see https://stackoverflow.com/a/67219519 **/
const rLerp = (start: number, end: number, alpha: number) => {
    const CS = Lerp(Math.cos(start), Math.cos(end), alpha);
    const SN = Lerp(Math.sin(start), Math.sin(end), alpha);
    return Math.atan2(SN, CS);
};

const Damp = (x: number, y: number, lambda: number, delta: number) => {
    return Lerp(x, y, 1 - Math.exp(-lambda * delta));
};

const Clamp = (x: number, min: number, max: number) => {
    return Math.max(Math.min(x, max), min);
};

/** A zero-width source range has progress 0. */
const iLerp = (x: number, xi: number, xf: number, options?: { clamp: boolean }) => {
    if (xi === xf) return 0;
    const res = (x - xi) / (xf - xi);
    if (options?.clamp === true) {
        return Clamp(res, 0, 1);
    }
    return res;
};

const map = (x: number, start1: number, end1: number, start2: number, end2: number, options?: { clamp: boolean }) => {
    return Lerp(start2, end2, iLerp(x, start1, end1, options));
};

const Round = (x: number, decimal?: number) => {
    decimal = decimal === undefined ? 100 : 10 ** decimal;
    return Math.round(x * decimal) / decimal;
};

/** Snap to the exact target when both values match at the requested precision. */
const RoundWhenClose = (a: number, b: number, decimal?: number) => {
    return Round(a, decimal) === Round(b, decimal) ? b : a;
};

const Rand = {
    // Function overload signatures
    /** 
    Ex: Rand.int(5) -> 0 to 4
    Ex: Rand.int(3, 8) -> 3 to 7
 */
    int: ((x1: number, x2?: number): number => {
        if (x2 === undefined) {
            return Math.floor(Rand.range(0, x1));
        }
        return Math.floor(Rand.range(x1, x2));
    }) as {
        (max: number): number;
        // eslint-disable-next-line  @typescript-eslint/unified-signatures
        (min: number, max: number): number;
    },
    /** Random float between min (inclusive) and max (exclusive). */
    range: (min: number, max: number) => {
        return min + Math.random() * (max - min);
    },
    arr: <T>(arr: Readonly<Array<T>>) => {
        return arr[Math.floor(Math.random() * arr.length)];
    },
};

const Arr = {
    /** Create an Array of n element */
    create: (ArrayLength: number) => {
        return [...Array(ArrayLength).keys()];
    },
    /** shuffle an Array, in place */
    shuffle: <T>(array: Array<T>) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j] as T, array[i] as T];
        }
        return array;
    },
    rand: Rand.arr,
    shift: <T>(arr: T[], newFirstIndex: number): T[] => {
        if (arr.length === 0 || newFirstIndex < 0 || newFirstIndex >= arr.length) {
            return arr;
        }

        return [...arr.slice(newFirstIndex), ...arr.slice(0, newFirstIndex)];
    },
    /** Remove every nth element in place, starting at index 0. */
    spliceNth: <T>(arr: T[], nth: number): T[] => {
        if (!Number.isInteger(nth) || nth <= 0) throw new Error("Step size must be a positive integer");

        const removed: T[] = [];
        let writeIndex = 0;

        for (let readIndex = 0; readIndex < arr.length; readIndex++) {
            if (readIndex % nth === 0) {
                removed.push(arr[readIndex]!);
            } else {
                arr[writeIndex++] = arr[readIndex]!;
            }
        }

        arr.length = writeIndex;
        return removed;
    },
};

const Digit = (t: number) => (9 < t ? "" + t : "0" + t);

const Class = {
    add: (el: Element, name: string) => {
        el.classList.add(name);
    },
    remove: (el: Element, name: string) => {
        el.classList.remove(name);
    },
    toggle: (el: Element, name: string, force?: boolean) => {
        el.classList.toggle(name, force);
    },
};

/** Check own property presence independently of its value. */
function isKeyOf<Key extends PropertyKey, T>(object: Record<Key, T>, key: PropertyKey): key is Key {
    return Object.prototype.hasOwnProperty.call(object, key);
}

const mod = (n: number, m: number) => ((n % m) + m) % m;

const Ease = {
    expo: {
        expo: gsap.parseEase("expo"),
        expoInOut: gsap.parseEase("expo.inOut"),
        expoIn: gsap.parseEase("expo.in"),
        expoOut: gsap.parseEase("expo.out"),
    },
    pow1: {
        in: gsap.parseEase("power1.in"),
        out: gsap.parseEase("power1.out"),
        inOut: gsap.parseEase("power1.inOut"),
    },
    pow2: {
        in: gsap.parseEase("power2.in"),
        out: gsap.parseEase("power2.out"),
        inOut: gsap.parseEase("power2.inOut"),
    },
    pow3: {
        in: gsap.parseEase("power3.in"),
        out: gsap.parseEase("power3.out"),
        inOut: gsap.parseEase("power3.inOut"),
    },
    pow4: {
        in: gsap.parseEase("power4.in"),
        out: gsap.parseEase("power4.out"),
        inOut: gsap.parseEase("power4.inOut"),
    },
};

export const P = {
    Lerp,
    rLerp,
    iLerp,
    Damp,
    map,
    Clamp,
    Round,
    RoundWhenClose,
    Rand,
    Arr,
    Digit,
    isKeyOf,
    Class,
    mod,
    Ease,
};

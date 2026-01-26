# Propagande Utils Documentation

This documentation covers the core utilities and Vue composables provided by the `@propagande-studio/utils` repository.

## Table of Contents

- [Shared Package (`@propagande-studio/utils/shared`)](#shared-package)
    - [Math utilities](#math-utilities)
    - [Array utilities](#array-utilities)
    - [Random utilities](#random-utilities)
    - [Class utilities](#class-utilities)
    - [Ticker](#ticker)
    - [Viewport](#viewport)
    - [Throttle & Debounce](#throttle--debounce)
- [Voir Package (`@propagande-studio/utils/voir`)](#voir-package)
    - [Animation & Motion](#animation--motion)
    - [GSAP Integration](#gsap-integration)
    - [Viewport & Resize](#viewport--resize)
    - [Lifecycle & Utilities](#lifecycle--utilities)

---

## Shared Package

Accessible via `import { P } from "@propagande-studio/utils"`.

### Math Utilities

| Function                          | Description                                         | Usage                            |
| --------------------------------- | --------------------------------------------------- | -------------------------------- |
| `Lerp(xi, xf, t)`                 | Linear interpolation between two values.            | `P.Lerp(0, 100, 0.5)` // 50      |
| `rLerp(start, end, alpha)`        | Rotational interpolation (useful for angles).       | `P.rLerp(0, Math.PI, 0.1)`       |
| `Damp(x, y, lambda, delta)`       | Smooth damping effect (framerate independent).      | `P.Damp(current, target, 8, dt)` |
| `Clamp(x, min, max)`              | Constrains a number between a min and max value.    | `P.Clamp(150, 0, 100)` // 100    |
| `map(x, s1, e1, s2, e2, options)` | Maps a value from one range to another.             | `P.map(0.5, 0, 1, 0, 100)` // 50 |
| `Round(x, decimal)`               | Rounds a number to a specific decimal precision.    | `P.Round(1.234, 2)` // 1.23      |
| `mod(n, m)`                       | Correct modulo operator (handles negative numbers). | `P.mod(-1, 5)` // 4              |

### Array Utilities

| Function                | Description                                      | Usage                                    |
| ----------------------- | ------------------------------------------------ | ---------------------------------------- |
| `Arr.create(length)`    | Creates an array of N elements (range 0 to N-1). | `P.Arr.create(5)` // [0, 1, 2, 3, 4]     |
| `Arr.shuffle(arr)`      | Shuffles an array in place.                      | `P.Arr.shuffle([1, 2, 3])`               |
| `Arr.rand(arr)`         | Returns a random element from an array.          | `P.Arr.rand([1, 2, 3])`                  |
| `Arr.shift(arr, idx)`   | Rotates array so it starts at `idx`.             | `P.Arr.shift([1, 2, 3], 1)` // [2, 3, 1] |
| `Arr.spliceNth(arr, n)` | Removes and returns every Nth element.           | `P.Arr.spliceNth([1, 2, 3, 4], 2)`       |

### Random Utilities

| Function               | Description                               | Usage                    |
| ---------------------- | ----------------------------------------- | ------------------------ |
| `Rand.int(max)`        | Random integer between 0 and `max-1`.     | `P.Rand.int(10)`         |
| `Rand.int(min, max)`   | Random integer between `min` and `max-1`. | `P.Rand.int(5, 10)`      |
| `Rand.range(min, max)` | Random float between `min` and `max`.     | `P.Rand.range(0.5, 1.5)` |

### Class Utilities

| Function                 | Description          | Usage                           |
| ------------------------ | -------------------- | ------------------------------- |
| `Class.add(el, name)`    | Adds a CSS class.    | `P.Class.add(div, 'active')`    |
| `Class.remove(el, name)` | Removes a CSS class. | `P.Class.remove(div, 'active')` |
| `Class.toggle(el, name)` | Toggles a CSS class. | `P.Class.toggle(div, 'active')` |

### Ticker

The Ticker provides a centralized `requestAnimationFrame` loop.

- **`getTicker()`**: Returns the ticker instance.
- **`ticker.add(fn, priority, once)`**: Add a callback.
- **`ticker.start() / ticker.stop()`**: Manage the loop.

### Viewport

A singleton to track window size, device info, and breakpoints.

- **`getViewport()`**: Returns the viewport instance.
- **Properties**: `viewport.width`, `height`, `isMobile`, `iOS`.
- **`viewport.add(fn, priority, noThrottle, immediate)`**: Listen for resizes.

### Throttle & Debounce

Useful for limiting executions on high-frequency events.

- `throttle(delay, callback, options)`
- `debounce(delay, callback, options)`

---

## Voir Package

Composables designed for Vue 3 projects, handling everything from physical animations to client-side lifecycle safety.

### Animation & Motion

#### `useDampedValue`

- **What it does**: Smoothly interpolates a value towards a target using framerate-independent damping.
- **When to use**: Smooth transitions for numbers, like cursor tracking or progress bars.
- **Example**:

```vue
<script setup>
import { ref } from "vue";
import { useDampedValue } from "@propagande-studio/utils/voir";

const target = ref(0);
const { damped } = useDampedValue({ target, lambda: 8 });

// When you change target.value, damped.value will smoothly follow.
</script>
```

#### `useSpring`

- **What it does**: Simulates physical spring motion with stiffness and damping.
- **When to use**: Playful, bouncy UI elements or realistic physics.
- **Example**:

```vue
<script setup>
const target = ref(0);
const { damped: position, velocity } = useSpring({
    target,
    stiffness: 100,
    damping: 10,
});
</script>
```

#### `useFrame`

- **What it does**: A hook that executes a callback on every ticker update (usually 60fps).
- **When to use**: Custom Canvas/WebGL rendering or manual DOM animations.
- **Example**:

```vue
<script setup>
import { useFrame } from "@propagande-studio/utils/voir";

useFrame(({ et, dt }) => {
    console.log(`Elapsed: ${et}, Delta: ${dt}`);
});
</script>
```

> [!TIP]
> You can pass `observedElement` to `useFrame` to only run the animation when the element is visible on screen.

### GSAP Integration

#### `useGSAPContext`

- **What it does**: Wraps GSAP animations in a context that is automatically cleaned up on unmount.
- **When to use**: Every time you create a GSAP animation in a component.
- **Example**:

```vue
<script setup>
import { useGSAPContext } from "@propagande-studio/utils/voir";
import { gsap } from "@propagande-studio/utils/gsap";

useGSAPContext((ctx) => {
    gsap.to(".box", { x: 100 });
});
</script>
```

#### `useGSAPMatchMedia`

- **What it does**: Responsive GSAP animations using global breakpoints.
- **Example**:

```vue
<script setup>
useGSAPMatchMedia((ctx) => {
    const { isLg } = ctx.conditions;
    gsap.to(".box", { x: isLg ? 500 : 100 });
});
</script>
```

### Viewport & Resize

| Composable           | Description                           | Simple Example                        |
| -------------------- | ------------------------------------- | ------------------------------------- |
| `useSize()`          | Reactive window dimensions.           | `const { width, height } = useSize()` |
| `useScroll()`        | Reactive window scroll position.      | `const scroll = useScroll()`          |
| `useIsLg()`          | Boolean for "Large" breakpoint.       | `const isMobile = !useIsLg().value`   |
| `useIsPointerFine()` | Check if user has a mouse (vs touch). | `const canHover = useIsPointerFine()` |

### Lifecycle & Utilities

#### `useSafeClient`

- **What it does**: Ensures a callback only runs when the browser/DOM is available.
- **When to use**: SSR apps (Nuxt) to prevent "window is not defined" errors.

```javascript
const result = useSafeClient(() => {
    return new SomeBrowserPlugin();
});
```

#### `createSharedComposable`

- **What it does**: Turns a regular composable into a "shared" one. The first component to call it initializes the state, and subsequent components share that same state. The state is destroyed when the last component unmounts.
- **When to use**: Tracking global data like window size, scroll position, or user sessions while avoiding redundant event listeners.
- **Example**:

```javascript
// sharedComposable.js
import { ref } from "vue";
import { createSharedComposable } from "@propagande-studio/utils/voir";

export const useSharedScroll = createSharedComposable(() => {
    const scrollY = ref(0);
    window.addEventListener("scroll", () => {
        scrollY.value = window.scrollY;
    });
    return scrollY;
});

// ComponentA.vue & ComponentB.vue
// Both will receive the EXACT SAME scrollY ref.
const scrollY = useSharedScroll();
```

#### `useWatchOnce`

- **What it does**: A `watch` that automatically stops itself after the first trigger.
- **Example**:

```javascript
useWatchOnce(someRef, (val) => {
    console.log("Triggered only once!");
});
```

import { afterEach, expect, test } from "bun:test";
import { createSSRApp, defineComponent, effectScope, h, onScopeDispose, ref } from "vue";
import { renderToString } from "vue/server-renderer";
import { createSharedComposable } from "./useSharedComposable";

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
afterEach(() => {
    if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
    else Reflect.deleteProperty(globalThis, "window");
});

test("isolates session state across sequential and concurrent SSR requests", async () => {
    const useSession = createSharedComposable((user: string) => ref(user));
    const render = (user: string) => renderToString(createSSRApp(defineComponent({
        setup() {
            const session = useSession(user);
            return () => h("p", session.value);
        },
    })));

    expect(await render("user-A")).toBe("<p>user-A</p>");
    expect(await render("user-B")).toBe("<p>user-B</p>");
    expect(await Promise.all([render("user-C"), render("user-D")])).toEqual(["<p>user-C</p>", "<p>user-D</p>"]);
});

test("shares browser state until the last subscriber disposes its scope", () => {
    Object.defineProperty(globalThis, "window", { configurable: true, value: {} });
    let created = 0;
    let disposed = 0;
    const useShared = createSharedComposable(() => {
        created++;
        onScopeDispose(() => { disposed++; });
        return ref(0);
    });
    const first = effectScope();
    const second = effectScope();
    const a = first.run(() => useShared())!;
    const b = second.run(() => useShared())!;
    a.value = 42;
    expect(b).toBe(a);
    expect(b.value).toBe(42);
    expect(created).toBe(1);
    first.stop();
    expect(disposed).toBe(0);
    second.stop();
    expect(disposed).toBe(1);
    const third = effectScope();
    expect(third.run(() => useShared())!.value).toBe(0);
    expect(created).toBe(2);
    third.stop();
});

test("keeps falsy state shared and recovers cleanly after initialization fails", () => {
    Object.defineProperty(globalThis, "window", { configurable: true, value: {} });
    let attempts = 0;
    let disposed = 0;
    const useShared = createSharedComposable(() => {
        attempts++;
        onScopeDispose(() => { disposed++; });
        if (attempts === 1) throw new Error("initialization failed");
        return false;
    });
    const first = effectScope();
    expect(() => first.run(() => useShared())).toThrow("initialization failed");
    expect(first.run(() => useShared())).toBe(false);
    const second = effectScope();
    expect(second.run(() => useShared())).toBe(false);
    expect(attempts).toBe(2);
    first.stop();
    second.stop();
    expect(disposed).toBe(2);
});

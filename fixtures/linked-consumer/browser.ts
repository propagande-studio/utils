import { assert, verifyConsumer } from "./consumer";
import { getTicker, getViewport } from "@propagande/utils";
import { useFrame, useGSAPMatchMedia, createSharedComposable } from "@propagande/utils/voir";
import { effectScope, ref } from "vue";

try {
    const checks = verifyConsumer();
    const ticker = getTicker();
    const scope = effectScope();
    let frames = 0;
    let mediaMatches = 0;
    getViewport().setBreakpoints([{ name: "lg", size: 0 }]);
    scope.run(() => {
        useFrame(() => frames++);
        useGSAPMatchMedia(() => mediaMatches++, { conditions: ["isLg"] });
    });
    try {
        ticker.start();
        await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        assert(frames >= 2, "browser frame callbacks");
        assert(mediaMatches === 1, "browser GSAP matchMedia");
    } finally {
        ticker.stop();
        scope.stop();
    }
    const useShared = createSharedComposable(() => ref(0));
    const first = effectScope();
    const second = effectScope();
    try {
        const a = first.run(useShared)!;
        const b = second.run(useShared)!;
        a.value = 42;
        assert(a === b && b.value === 42, "shared browser state");
    } finally {
        first.stop();
        second.stop();
    }
    document.body.textContent = `PASS: ${checks}, browser frames, matchMedia and shared state`;
    document.body.dataset.result = "pass";
} catch (error) {
    document.body.textContent = `FAIL: ${error instanceof Error ? error.stack : error}`;
    document.body.dataset.result = "fail";
}

import { P, getTicker, getViewport } from "@propagande/utils";
import { getTicker as sharedTicker, getViewport as sharedViewport, type TickerHandler } from "@propagande/utils/shared";
import { useFrame, useResize, useDampedValue, useSpring, useGSAPContext } from "@propagande/utils/voir";
import { gsap, SplitTextAnimator, ScrollTrigger, SplitText } from "@propagande/utils/gsap";
import { gsap as peerGSAP } from "gsap";
import { effectScope, ref, type Ref } from "vue";

export function assert(condition: unknown, message: string): asserts condition {
    if (!condition) throw new Error(message);
}

export function verifyConsumer() {
    assert(P.Lerp(0, 10, 0.5) === 5, "math utility");
    assert(P.Ease.pow2.in(0.5) === peerGSAP.parseEase("power2.in")(0.5), "GSAP easing");
    assert(gsap === peerGSAP, "GSAP peer instance");
    assert(typeof SplitTextAnimator === "function" && typeof SplitText === "function" && typeof ScrollTrigger === "function", "GSAP exports");
    assert(getTicker === sharedTicker && getViewport === sharedViewport, "root and shared aliases");

    const ticker = getTicker();
    const viewport = getViewport();
    const add = ticker.add;
    const remove = ticker.remove;
    const subscribed = new Set<TickerHandler>();
    const removed = new Set<TickerHandler>();
    const scope = effectScope();
    const target = { x: 0 };
    try {
        ticker.add = (fn, ...args) => {
            subscribed.add(fn);
            return add.call(ticker, fn, ...args);
        };
        ticker.remove = (fn) => {
            removed.add(fn);
            return remove.call(ticker, fn);
        };
        scope.run(() => {
            useFrame(() => {});
            const { damped } = useDampedValue({ target: ref(10) });
            const value: Ref<number> = damped;
            assert(typeof value.value === "number", "damped value type and runtime");
            useSpring({ target: ref(10) });
            useResize((_size, instance) => assert(instance === viewport, "shared viewport in voir"));
            useGSAPContext(() => {
                const tween = gsap.to(target, { x: 100, duration: 1, paused: true });
                tween.progress(0.5);
                assert(target.x > 0 && target.x < 100, "GSAP context animation");
            });
        });
        assert(subscribed.size === 3, "frame, damping and spring must use the root ticker");
        assert(gsap.getTweensOf(target).length === 1, "animation registered");
        scope.stop();
        assert([...subscribed].every((fn) => removed.has(fn)), "ticker subscriptions disposed");
        assert(gsap.getTweensOf(target).length === 0, "GSAP context disposed");
    } finally {
        scope.stop();
        ticker.add = add;
        ticker.remove = remove;
    }
    return "exports, types, ticker, viewport, damping, spring, GSAP animation and cleanup";
}

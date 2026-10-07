import { type TickerHandler, getTicker } from "../../shared/ticker";
import { useSafeClient } from "./useSafeClient";
import { onScopeDispose, toRef, type MaybeRef } from "vue";

export function useFrame(fn: TickerHandler, priority?: number, once?: boolean, observedElement?: MaybeRef<HTMLElement | null | undefined>) {
    if (observedElement) {
        observedElement = toRef(observedElement);
    }

    return useSafeClient(() => {
        const ticker = getTicker();

        let observer: IntersectionObserver | null = null;

        if (observedElement && observedElement.value) {
            const intersectionCallback: IntersectionObserverCallback = (entries) => {
                const entry = entries[0];
                if (!entry) return;

                if (entry.isIntersecting) {
                    ticker.add(fn, priority, once);
                } else {
                    ticker.remove(fn);
                }
            };

            observer = new IntersectionObserver(intersectionCallback);
            observer.observe(observedElement.value);
        } else {
            ticker.add(fn, priority, once);
        }

        onScopeDispose(() => {
            observer?.disconnect();
            ticker.remove(fn);
        });
    });
}

import { type TickerHandler, getTicker } from "@propagande-studio/utils/shared";
import { useSafeClient } from "./useSafeClient";
import { onScopeDispose } from "vue";

export function useFrame(fn: TickerHandler, priority?: number, once?: boolean) {
    return useSafeClient(() => {
        const ticker = getTicker();

        ticker.add(fn, priority, once);

        onScopeDispose(() => {
            ticker.remove(fn);
        });
    });
}

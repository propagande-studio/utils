import { type TickerHandler, getTicker } from "@propagande-studio/utils/shared";
import { useSafeClient } from "./useSafeClient";
import { onScopeDispose } from "vue";

export function useFrame(fn: TickerHandler, priority?: number) {
    return useSafeClient(() => {
        const ticker = getTicker();

        ticker.add(fn, priority);

        onScopeDispose(() => {
            console.log("scope dispose");
            ticker.remove(fn);
        });
    });
}

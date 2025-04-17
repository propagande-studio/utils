import { type TickerHandler, getTicker } from "@propagande-studio/utils/shared";
import { useSafeClient } from "./useSafeClient";

export function useFrame(fn: TickerHandler, priority?: number) {
    const scope = useSafeClient(() => {
        const ticker = getTicker();
        ticker.add(fn, priority);

        return () => {
            ticker.remove(fn);
        };
    });

    return scope;
}

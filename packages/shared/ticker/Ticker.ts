import { gsap } from "@propagande-studio/utils/gsap";

export interface TickerHandler {
    (time: { et: number; dt: number }): void;
}

export class Ticker {
    private gsapTicker: typeof gsap.ticker;
    private updateFns: { fn: TickerHandler; priority: number }[];
    time: number = 0;

    constructor() {
        this.gsapTicker = gsap.ticker;
        this.updateFns = [];
    }

    update: gsap.TickerCallback = (time, deltaTime) => {
        this.time = time;
        this.updateFns.forEach((u) => u.fn({ et: time, dt: deltaTime / 1000 }));
    };

    add(fn: TickerHandler, priority = 0) {
        const listener = { fn, priority };

        this.updateFns.push(listener);
        this.updateFns.sort((a, b) => a.priority - b.priority);

        return () => {
            this.remove(fn);
        };
    }

    remove(fn: TickerHandler) {
        const listenerIndex = this.updateFns.findIndex((u) => u.fn === fn);

        if (listenerIndex !== -1) {
            this.updateFns.splice(listenerIndex, 1);
        }
    }

    start() {
        this.stop();
        this.gsapTicker.add(this.update);
    }

    stop() {
        this.gsapTicker.remove(this.update);
    }
}

let ticker: Ticker | null = null;

export const getTicker = () => {
    if (!ticker) {
        ticker = new Ticker();
    }

    return ticker as Ticker;
};

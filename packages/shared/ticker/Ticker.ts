export interface TickerHandler {
    (time: { et: number; dt: number }): void;
}

export class Ticker {
    private updateFns: { fn: TickerHandler; priority: number; pt: number; et: number; dt: number }[];
    private animationFrameId: number | null = null;
    private lastTime: number = 0;
    private startTime: number = 0;
    private isRunning: boolean = false;

    time: number = 0;

    intervalId: ReturnType<typeof setInterval> | undefined;

    constructor() {
        this.updateFns = [];
    }

    private tick = (currentTime: number) => {
        if (!this.isRunning) return;

        if (this.startTime === 0) {
            this.startTime = currentTime;
            this.lastTime = currentTime;
        }

        const deltaTime = currentTime - this.lastTime;
        this.time = (currentTime - this.startTime) / 1000; // Convert to seconds
        this.lastTime = currentTime;

        this.updateFns.forEach((u) => {
            const _deltaTime = Math.min(1, deltaTime / 1000);
            u.pt = u.et;
            u.et += _deltaTime;
            u.dt = u.et - u.pt;

            u.fn({ et: u.et, dt: u.dt });
        });

        this.animationFrameId = requestAnimationFrame(this.tick);
    };

    add(fn: TickerHandler, priority = 0) {
        const listener = { fn, priority, pt: 0, et: 0, dt: 0 };

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
        this.isRunning = true;
        this.startTime = 0;
        this.animationFrameId = requestAnimationFrame(this.tick);
    }

    stop() {
        this.isRunning = false;
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
}

let ticker: Ticker | null = null;

export const getTicker = () => {
    if (!ticker) {
        ticker = new Ticker();
    }

    return ticker as Ticker;
};

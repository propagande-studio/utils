import { ScrollTrigger } from "../../gsap";
import { throttle } from "../throttle-debounce";

export interface ViewportHandler {
    (size: { width: number; height: number }, viewport: Viewport): void;
}

export class Viewport {
    public width: number = 0;
    public height: number = 0;
    public previousWidth: number = 0;
    public previousHeight: number = 0;
    public fakeFullHeight: number = 0;
    public iOS: boolean = false;
    public isMobile: boolean = false;
    public isWindows: boolean = false;
    public breakpoints: { name: string; size: number; active: boolean }[] = [];
    public pointerMatchMedia: MediaQueryList | null = null;
    private updateFns: { fn: ViewportHandler; priority: number; noThrottle: boolean }[] = [];

    constructor() {
        if (typeof window !== "undefined") {
            this.pointerMatchMedia = window.matchMedia("(hover: hover)");

            this.checkDevice();
        }
    }

    checkDevice() {
        this.iOS =
            ["iPad Simulator", "iPhone Simulator", "iPod Simulator", "iPad", "iPhone", "iPod"].includes(navigator.platform) ||
            (navigator.userAgent.includes("Mac") && "ontouchend" in document);
        this.isWindows = navigator.userAgent.includes("Windows");
        this.isMobile = !this.pointerMatchMedia!.matches || this.iOS;
    }

    getFullVh() {
        const el = document.createElement("div");
        el.style.cssText = "position:fixed;top:0;left:0;height:100vh;visibility:hidden;pointer-events:none;";
        document.body.appendChild(el);
        const height = el.offsetHeight;
        document.body.removeChild(el);

        return height;
    }

    internalResize = () => {
        let shouldUpdate = false;

        this.previousWidth = this.width;
        this.previousHeight = this.height;

        this.width = window.innerWidth;
        this.height = window.innerHeight;

        if (
            this.isMobile &&
            this.previousWidth === this.width &&
            this.previousHeight <= this.height &&
            Math.abs(this.height - this.previousHeight) < this.height * 0.15
        ) {
            // keep the previous height to avoid useless resize
            this.height = this.previousHeight;
        } else {
            shouldUpdate = true;
        }

        if (this.isMobile) {
            // if in landscape mode
            if (this.width > this.height) {
                this.height = window.innerHeight;

                shouldUpdate = true;
            }
        }

        this.checkBreakpoints();
        if (shouldUpdate) {
            this.setProperties();
        }

        return shouldUpdate;
    };

    onResize = () => {
        const shouldUpdate = this.internalResize();

        if (shouldUpdate) {
            this.updateNoThrottle();
            this.updateThrottled();
        }
    };

    forceResize() {
        this.internalResize();
        this.updateNoThrottle();
        this.updateThrottled();
    }

    updateNoThrottle = () => {
        this.updateFns
            .filter((fn) => fn.noThrottle)
            .forEach((u) =>
                u.fn(
                    {
                        width: this.width,
                        height: this.height,
                    },
                    this,
                ),
            );
    };

    updateThrottled = throttle(200, () => {
        this.updateFns
            .filter((fn) => !fn.noThrottle)
            .forEach((u) =>
                u.fn(
                    {
                        width: this.width,
                        height: this.height,
                    },
                    this,
                ),
            );

        setTimeout(() => {
            ScrollTrigger.refresh();
        }, 1);
    });

    onPointerChange = (e: MediaQueryListEvent) => {
        this.isMobile = !e.matches || this.iOS;
    };

    setProperties() {
        if (this.isMobile) {
            const proxyEl = document.createElement("div");
            proxyEl.style.cssText = `position: fixed; top: 0;`;
            document.body.appendChild(proxyEl);

            proxyEl.style.height = "100vh";
            document.documentElement.style.setProperty("--vh", `${proxyEl.offsetHeight / 100}px`);

            proxyEl.style.height = "100dvh";
            document.documentElement.style.setProperty("--dvh", `${proxyEl.offsetHeight / 100}px`);

            proxyEl.style.height = "100svh";
            document.documentElement.style.setProperty("--svh", `${proxyEl.offsetHeight / 100}px`);

            proxyEl.style.height = "100lvh";
            document.documentElement.style.setProperty("--lvh", `${proxyEl.offsetHeight / 100}px`);

            document.body.removeChild(proxyEl);

            return;
        }

        document.documentElement.style.setProperty("--vh", "1vh");
        document.documentElement.style.setProperty("--dvh", "1dvh");
        document.documentElement.style.setProperty("--svh", "1svh");
        document.documentElement.style.setProperty("--lvh", "1lvh");
    }

    checkBreakpoints() {
        for (const breakpoint of this.breakpoints) {
            breakpoint.active = this.width >= breakpoint.size;
        }
    }

    setBreakpoints(breakpoints: { name: string; size: number }[]) {
        this.breakpoints = breakpoints.map((bp) => ({ ...bp, ...{ active: false } }));
    }

    add(fn: ViewportHandler, priority = 0, noThrottle = false, immediate = false) {
        const listener = { fn, priority, noThrottle };

        this.updateFns.push(listener);
        this.updateFns.sort((a, b) => a.priority - b.priority);

        if (immediate) {
            listener.fn(
                {
                    width: this.width,
                    height: this.height,
                },
                this,
            );
        }

        return () => {
            this.remove(fn);
        };
    }

    remove(fn: ViewportHandler) {
        const listenerIndex = this.updateFns.findIndex((u) => u.fn === fn);

        if (listenerIndex !== -1) {
            this.updateFns.splice(listenerIndex, 1);
        }
    }

    start() {
        this.stop();
        window.addEventListener("resize", this.onResize, false);
        this.pointerMatchMedia!.addEventListener("change", this.onPointerChange);
        this.internalResize();

        setTimeout(() => {
            ScrollTrigger.refresh();
        }, 1);
    }

    stop() {
        window.removeEventListener("resize", this.onResize, false);
        this.pointerMatchMedia!.removeEventListener("change", this.onPointerChange);
    }
}

let viewport: Viewport | null = null;

export const getViewport = () => {
    if (!viewport) {
        viewport = new Viewport();
    }

    return viewport;
};

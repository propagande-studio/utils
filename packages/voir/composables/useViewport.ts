import { getViewport, type ViewportHandler } from "@propagande-studio/utils/shared";
import { useSafeClient } from "./useSafeClient";
import { computed, effectScope, onScopeDispose, reactive, ref, watch, type Ref } from "vue";
import { createSharedComposable } from "./useSharedComposable";

export function useResize(fn: ViewportHandler, priority?: number, noThrottle?: boolean) {
    return useSafeClient(() => {
        const viewport = getViewport();

        viewport.add(fn, priority, noThrottle, true);

        onScopeDispose(() => {
            viewport.remove(fn);
        });
    });
}

export function watchBreakpoint(bp: string, fn: (active: boolean) => void) {
    const viewport = getViewport();
    const bpRef = ref<boolean>();

    const watcher = watch(
        bpRef as Ref<boolean>,
        (active: boolean) => {
            fn(active);
        },
        {
            flush: "sync",
        },
    );

    const handler = () => {
        bpRef.value = (
            viewport.breakpoints.find((_bp) => _bp.name === bp) as {
                active: boolean;
            }
        ).active;
    };

    useResize(handler, -1, true);

    return watcher;
}

export function watchPointer(fn: (isFine: boolean) => void) {
    const viewport = getViewport();

    const scope = effectScope();

    /** @param {MediaQueryListEvent} e */
    const onMedia = (e: MediaQueryListEvent) => {
        fn(e.matches);
    };

    if (typeof window !== "undefined") {
        scope.run(() => {
            (viewport.pointerMatchMedia as MediaQueryList).addEventListener("change", onMedia);

            fn((viewport.pointerMatchMedia as MediaQueryList).matches);

            onScopeDispose(() => {
                (viewport.pointerMatchMedia as MediaQueryList).removeEventListener("change", onMedia);
            });
        });
    }
}

export function useIsLg() {
    const isLg = ref(false);

    watchBreakpoint("lg", (active) => {
        isLg.value = active;
    });

    return isLg;
}

export function useSize() {
    const size = reactive({ width: 0, height: 0 });

    useResize(
        ({ width, height }) => {
            console.log("resize");
            size.width = width;
            size.height = height;
        },
        -1,
        true,
    );

    return size;
}

export const useScroll = createSharedComposable(function useScroll({ offset = 0 }: { offset?: number } = {}) {
    const scroll = ref(0);

    useSafeClient(() => {
        const onScroll = () => {
            scroll.value = window.scrollY || document.documentElement.scrollTop;
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();

        onScopeDispose(() => {
            window.removeEventListener("scroll", onScroll);
        });
    });

    return scroll;
});

export function useIsPointerFine() {
    const isFine = ref(false);

    watchPointer((fine) => {
        isFine.value = fine;
    });

    return isFine;
}

export function useIsTouchOrMobile() {
    const isFine = useIsPointerFine();
    const isLg = useIsLg();

    return computed(() => {
        return !isFine.value || !isLg.value;
    });
}

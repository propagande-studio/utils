import { shallowRef, watch, type WatchSource, type WatchCallback, type WatchOptions } from "vue";

export const useWatchOnce = <T = any, Immediate extends Readonly<boolean> = false>(
    source: WatchSource<T>,
    callback: WatchCallback<T, T | undefined>,
    options?: WatchOptions<Immediate>
) => {
    const hasBeenCalled = shallowRef(false);

    const wrappedCallback: WatchCallback<T, T | undefined> = (newValue, oldValue, onCleanup) => {
        if (hasBeenCalled.value) return;

        hasBeenCalled.value = true;
        callback(newValue, oldValue, onCleanup);
    };

    const unwatch = watch(source, wrappedCallback, options);

    return unwatch;
};

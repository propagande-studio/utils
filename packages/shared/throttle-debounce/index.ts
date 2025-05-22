export interface ThrottleOptions {
    noTrailing?: boolean;
    noLeading?: boolean;
    debounceMode?: boolean;
}

export interface DebounceOptions {
    atBegin?: boolean;
}

export interface CancelOptions {
    upcomingOnly?: boolean;
}

export interface Cancel {
    cancel: (options?: CancelOptions) => void;
}

/**
 * Throttle execution of a function. Especially useful for rate limiting
 * execution of handlers on events like resize and scroll.
 *
 * @param delay - A zero-or-greater delay in milliseconds
 * @param callback - A function to be executed after delay milliseconds
 * @param options - An object to configure throttle behavior
 * @returns A new, throttled function
 */
export const throttle = <T extends (...args: any[]) => any>(delay: number, callback: T, options?: ThrottleOptions): T & Cancel => {
    const { noTrailing = false, noLeading = false, debounceMode = undefined } = options || {};

    let timeoutID: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;
    let lastExec = 0; // Keep track of the last time `callback` was executed

    // Function to clear existing timeout
    const clearExistingTimeout = () => {
        if (timeoutID) {
            clearTimeout(timeoutID);
        }
    };

    // Function to cancel next exec
    const cancel = (options?: CancelOptions) => {
        const { upcomingOnly = false } = options || {};
        clearExistingTimeout();
        cancelled = !upcomingOnly;
    };

    // The wrapper function encapsulates all throttling functionality
    function wrapper(this: unknown, ...args: Parameters<T>) {
        const self = this;
        const elapsed = Date.now() - lastExec;

        if (cancelled) {
            return;
        }

        // Execute `callback` and update the `lastExec` timestamp
        const exec = () => {
            lastExec = Date.now();
            callback.apply(self, args);
        };

        // If `debounceMode` is true (at begin) this is used to clear the flag
        // to allow future `callback` executions
        const clear = () => {
            timeoutID = undefined;
        };

        if (!noLeading && debounceMode && !timeoutID) {
            // Since `wrapper` is being called for the first time and
            // `debounceMode` is true (at begin), execute `callback`
            exec();
        }

        clearExistingTimeout();

        if (debounceMode === undefined && elapsed > delay) {
            if (noLeading) {
                // In throttle mode with noLeading, if `delay` time has
                // been exceeded, update `lastExec` and schedule `callback`
                // to execute after `delay` ms
                lastExec = Date.now();
                if (!noTrailing) {
                    timeoutID = setTimeout(debounceMode ? clear : exec, delay);
                }
            } else {
                // In throttle mode without noLeading, if `delay` time has been exceeded, execute
                // `callback`
                exec();
            }
        } else if (noTrailing !== true) {
            // In trailing throttle mode, since `delay` time has not been
            // exceeded, schedule `callback` to execute `delay` ms after most
            // recent execution
            timeoutID = setTimeout(debounceMode ? clear : exec, debounceMode === undefined ? delay - elapsed : delay);
        }
    }

    wrapper.cancel = cancel;

    // Cast the wrapper function to the original function type plus Cancel
    return wrapper as unknown as T & Cancel;
};

/**
 * Debounce execution of a function. Debouncing, unlike throttling,
 * guarantees that a function is only executed a single time, either at the
 * very beginning of a series of calls, or at the very end.
 *
 * @param delay - A zero-or-greater delay in milliseconds
 * @param callback - A function to be executed after delay milliseconds
 * @param options - An object to configure debounce behavior
 * @returns A new, debounced function
 */
export const debounce = <T extends (...args: any[]) => any>(delay: number, callback: T, options?: DebounceOptions): T & Cancel => {
    const { atBegin = false } = options || {};
    return throttle(delay, callback, { debounceMode: atBegin !== false });
};

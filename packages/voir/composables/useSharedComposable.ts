import { effectScope, onScopeDispose, type EffectScope } from "vue";

export function createSharedComposable<T extends (...args: any[]) => any>(composable: T): T {
    let subscribers = 0;
    let state: ReturnType<T> | undefined | null = null;
    let scope: EffectScope | null = null;
    let initialized = false;

    const dispose = () => {
        if (scope && --subscribers <= 0) {
            scope.stop();
            state = scope = null;
            initialized = false;
        }
    };

    return ((...args) => {
        // A module-level closure outlives SSR requests. Never cache server state.
        if (typeof window === "undefined") return composable(...args);

        if (!initialized) {
            scope = effectScope(true);
            try {
                state = scope.run(() => composable(...args));
                initialized = true;
            } catch (error) {
                scope.stop();
                scope = null;
                throw error;
            }
        }
        subscribers++;
        onScopeDispose(dispose);
        return state as ReturnType<T>;
    }) as T;
}

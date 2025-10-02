import { effectScope, EffectScope, onScopeDispose } from "vue";

export function createSharedComposable<T extends (...args: any[]) => any>(composable: T): T {
    let subscribers = 0;
    let state: ReturnType<T> | undefined | null = null;
    let scope: EffectScope | null = null;

    const dispose = () => {
        if (scope && --subscribers <= 0) {
            scope.stop();
            state = scope = null;
        }
    };

    return ((...args) => {
        subscribers++;
        if (!state) {
            scope = effectScope(true);
            state = scope.run(() => composable(...args));
        }
        onScopeDispose(dispose);
        return state as ReturnType<T>;
    }) as T;
}

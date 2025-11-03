import { effectScope, getCurrentInstance, getCurrentScope, getCurrentWatcher, onMounted, onWatcherCleanup, shallowRef, type ShallowRef } from "vue";

export enum EffectMode {
    watcher = "watcher",
    instance = "instance",
    scope = "scope",
}

export const useSafeClient = <T>(callback: () => T, options?: { unsafe?: boolean; forceMode?: EffectMode }): ShallowRef<T | null> => {
    const unsafe = options?.unsafe || false; // for directives
    const forceMode = options?.forceMode || false; // for directives

    const callbackResult = shallowRef<T | null>(null);

    const currentScope = getCurrentScope(),
        currentWatcher = getCurrentWatcher(),
        currentInstance = getCurrentInstance();

    switch (forceMode) {
        case EffectMode.instance: {
            if (!currentInstance) throw "useSafeClient is called outside an instance";

            const scope = effectScope();

            if (!currentInstance.isMounted) {
                onMounted(() => {
                    callbackResult.value = scope.run(() => {
                        return callback();
                    });
                });
            } else {
                callbackResult.value = scope.run(() => {
                    return callback();
                });
            }

            break;
        }
        case EffectMode.scope: {
            if (!currentScope) throw "useSafeClient is called outside a scope";

            const scope = effectScope();

            callbackResult.value = scope.run(() => {
                return callback();
            });

            break;
        }
        case EffectMode.watcher: {
            if (!currentWatcher) throw "useSafeClient is called outside a watcher";

            const scope = effectScope();

            onWatcherCleanup(() => {
                scope.stop();
            });

            callbackResult.value = scope.run(() => {
                return callback();
            });

            break;
        }
        default:
            {
                if (!unsafe && !currentScope && !currentWatcher && !currentInstance) throw "useSafeClient is called outside a scope or watcher";

                const scope = effectScope();

                if (currentWatcher) {
                    onWatcherCleanup(() => {
                        scope.stop();
                    });
                }

                if (currentInstance && !currentInstance.isMounted && !currentWatcher) {
                    onMounted(() => {
                        callbackResult.value = scope.run(() => {
                            return callback();
                        });
                    });
                } else {
                    callbackResult.value = scope.run(() => {
                        return callback();
                    });
                }
            }

            return callbackResult;
    }

    return callbackResult;
};

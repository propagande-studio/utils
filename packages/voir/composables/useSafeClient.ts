import { effectScope, getCurrentInstance, getCurrentScope, getCurrentWatcher, onMounted, onScopeDispose, onWatcherCleanup, shallowRef } from "vue";

export enum EffectMode {
    watcher = "watcher",
    instance = "instance",
    scope = "scope",
}

export const useSafeClient = <T>(callback: () => T, options?: { detached?: boolean; unsafe?: boolean; forceMode?: EffectMode }) => {
    const detached = options?.detached || false;
    const unsafe = options?.unsafe || false; // for directives
    const forceMode = options?.forceMode || false; // for directives

    const callbackResult = shallowRef<T | null>(null);

    const currentScope = getCurrentScope(),
        currentWatcher = getCurrentWatcher(),
        currentInstance = getCurrentInstance();

    switch (forceMode) {
        case EffectMode.instance: {
            if (!currentInstance) throw "useSafeClient is called outside an instance";
            break;
        }
        case EffectMode.scope: {
            if (!currentScope) throw "useSafeClient is called outside a scope";
            break;
        }
        case EffectMode.watcher: {
            if (!currentWatcher) throw "useSafeClient is called outside a watcher";
            break;
        }
        default: {
            if (!unsafe && !detached && !currentScope && !currentWatcher && !currentInstance) throw "useSafeClient is called outside a scope or watcher";
        }
    }

    const scope = effectScope(detached);

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

    return callbackResult;
};

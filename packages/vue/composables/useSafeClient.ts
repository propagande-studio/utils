import { effectScope, getCurrentInstance, getCurrentScope, getCurrentWatcher, onMounted, onWatcherCleanup } from "vue";

export const useSafeClient = (callback: () => void, options?: { detached?: boolean; unsafe?: boolean }) => {
    const detached = options?.detached || false;
    const unsafe = options?.unsafe || false; // for directives

    const currentScope = getCurrentScope(),
        currentWatcher = getCurrentWatcher(),
        currentInstance = getCurrentInstance();

    if (!unsafe && !detached && !currentScope && !currentWatcher && !currentInstance) throw "useSafeClient is outside a scope or watcher";

    const scope = effectScope(detached);

    if (currentWatcher) {
        onWatcherCleanup(() => {
            scope.stop();
        });
    }

    if (currentInstance && !currentInstance.isMounted && !currentWatcher) {
        onMounted(() => {
            scope.run(() => {
                callback();
            });
        });
    } else {
        scope.run(() => {
            callback();
        });
    }

    return scope;
};

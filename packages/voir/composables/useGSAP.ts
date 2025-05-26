import { effectScope, getCurrentScope, onScopeDispose, capitalize } from "vue";
import { getViewport } from "@propagande-studio/utils";
import { gsap } from "@propagande-studio/utils/gsap";
import { EffectMode, useSafeClient } from "./useSafeClient";

export const useGSAPContext = (callback?: (ctx: gsap.Context) => void, revert: boolean = false, forceMode?: EffectMode) => {
    return useSafeClient(
        () => {
            const ctx = gsap.context((_ctx) => {
                return callback?.(_ctx);
            });

            onScopeDispose(() => {
                ctx.kill(revert);
            });

            return ctx;
        },
        { forceMode }
    );
};

export const useGSAPMatchMedia = (callback?: (ctx: gsap.Context) => void, revert: boolean = false) => {
    if (!getCurrentScope()) throw new Error("useGSAPMatchMedia must be called within a scope");

    const viewport = getViewport();

    return useSafeClient(() => {
        const scope = effectScope();

        const mm = gsap.matchMedia();

        const conditions = viewport.breakpoints.reduce((conditions, breakpoint) => {
            conditions[`is${capitalize(breakpoint.name)}`] = `(min-width: ${breakpoint.size}px)`;
            return conditions;
        }, {} as Record<string, string>);

        conditions.isPointerFine = "(hover: hover)";

        mm.add(conditions, (ctx) => {
            return scope.run(() => {
                return callback?.(ctx);
            });
        });

        onScopeDispose(() => {
            mm.kill(revert);
        });

        return mm;
    });
};

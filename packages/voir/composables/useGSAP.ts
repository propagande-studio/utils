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
        { forceMode },
    );
};

type GSAPMatchMediaOptions = {
    revert?: boolean;
    conditions?: readonly string[];
};

export const useGSAPMatchMedia = (callback?: (ctx: gsap.Context) => void, revertOrOptions: boolean | GSAPMatchMediaOptions = false) => {
    if (!getCurrentScope()) throw new Error("useGSAPMatchMedia must be called within a scope");

    const viewport = getViewport();
    const options = typeof revertOrOptions === "boolean" ? { revert: revertOrOptions } : revertOrOptions;

    return useSafeClient(() => {
        const scope = effectScope();

        const mm = gsap.matchMedia();

        const availableConditions = viewport.breakpoints.reduce(
            (conditions, breakpoint) => {
                conditions[`is${capitalize(breakpoint.name)}`] = `(min-width: ${breakpoint.size}px)`;
                return conditions;
            },
            {} as Record<string, string>,
        );

        availableConditions.isPointerFine = "(hover: hover)";

        const conditions = options.conditions
            ? Object.fromEntries(
                  options.conditions.map((name) => {
                      const query = availableConditions[name];
                      if (!query) throw new Error(`Unknown GSAP media condition: ${name}`);
                      return [name, query];
                  }),
              )
            : availableConditions;

        // if matchMedia is used without any conditions, it will not run the callback on initial load, so we add a default condition that always matches
        conditions.is = "(min-width: 0px)";

        mm.add(conditions, (ctx) => {
            return scope.run(() => {
                return callback?.(ctx);
            });
        });

        onScopeDispose(() => {
            mm.kill(options.revert ?? false);
        });

        return mm;
    });
};

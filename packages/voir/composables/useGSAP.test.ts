import { expect, mock, test } from "bun:test";
import { gsap } from "gsap";
import { effectScope } from "vue";

const registeredConditions: Record<string, string>[] = [];

mock.module("@propagande-studio/utils", () => ({
    getViewport: () => ({
        breakpoints: [
            { name: "lg", size: 1024 },
            { name: "xl", size: 1440 },
        ],
    }),
}));

mock.module("@propagande-studio/utils/gsap", () => ({
    gsap: {
        ...gsap,
        matchMedia: () => ({
            add: (conditions: Record<string, string>) => registeredConditions.push(conditions),
            kill: () => {},
        }),
    },
}));

const { useGSAPMatchMedia } = await import("./useGSAP");

test("subscribes only to selected conditions", () => {
    const scope = effectScope();
    scope.run(() => useGSAPMatchMedia(undefined, { conditions: ["isLg"] }));

    expect(registeredConditions.pop()).toEqual({ isLg: "(min-width: 1024px)", is: "(min-width: 0px)" });
    scope.stop();
});

test("preserves all conditions for existing calls", () => {
    const scope = effectScope();
    scope.run(() => useGSAPMatchMedia());

    expect(registeredConditions.pop()).toEqual({
        isLg: "(min-width: 1024px)",
        isXl: "(min-width: 1440px)",
        isPointerFine: "(hover: hover)",
        is: "(min-width: 0px)",
    });
    scope.stop();
});

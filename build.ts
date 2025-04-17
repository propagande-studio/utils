import type { BuildConfig } from "bun";
import { build } from "./scripts/build";

export const buildConfig: BuildConfig = {
    entrypoints: ["./packages/shared/index.ts", "./packages/voir/index.ts"],
    outdir: "./dist",
    target: "browser",
    format: "esm",
    minify: false,
    external: ["vue", "react", "gsap", "@propagande-studio/utils"],
    sourcemap: "linked",
    naming: {
        entry: "[dir]-[name].[ext]", // Avoid having a sub directory as source maps got lost... Might be fixable.
        chunk: "[name]-[hash].[ext]",
        asset: "[name]-[hash].[ext]",
    },
    footer: "// PROPERTY OF PROPAGANDE.",
};

await build({
    ...buildConfig,
});

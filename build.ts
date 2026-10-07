import type { BuildConfig } from "bun";
import { rm } from "node:fs/promises";
import { build } from "./scripts/build";

export const buildConfig: BuildConfig = {
    entrypoints: ["./packages/shared/index.ts", "./packages/voir/index.ts", "./packages/gsap/index.ts"],
    outdir: "./dist",
    target: "browser",
    format: "esm",
    splitting: true,
    minify: false,
    external: ["vue", "react", "gsap"],
    sourcemap: "linked",
    naming: {
        entry: "[dir]-[name].[ext]", // Avoid having a sub directory as source maps got lost... Might be fixable.
        chunk: "[name]-[hash].[ext]",
        asset: "[name]-[hash].[ext]",
    },
    footer: "// PROPERTY OF PROPAGANDE.",
};

// Remove old hashed chunks before producing a release build.
await rm("./dist", { recursive: true, force: true });
await build({
    ...buildConfig,
});

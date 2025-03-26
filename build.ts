await Bun.build({
    entrypoints: ["./packages/shared/index.ts", "./packages/vue/index.ts"],
    outdir: "./dist",
    target: "browser",
    format: "esm",
    minify: true,
    external: ["vue", "react"],
});

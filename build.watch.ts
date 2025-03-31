import { buildConfig } from "./build";
import { build } from "./scripts/build";

await build({
    ...buildConfig,
    watch: "./packages",
});

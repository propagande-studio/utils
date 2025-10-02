import { type BuildArtifact, type BuildOutput, type BuildConfig as BunBuildConfig } from "bun";
import fs from "node:fs";
import { dirname, join, resolve } from "node:path";

const cwd = process.cwd();

function absolute(path: string) {
    return resolve(cwd, path);
}

async function getArtifactSources(artifact: BuildArtifact) {
    try {
        await fs.promises.access(artifact.path, fs.constants.R_OK);
        const sourcemap = await artifact.sourcemap?.json();
        if (!sourcemap) return [];
        return (sourcemap.sources as string[]).map((source) => join(dirname(artifact.path), source));
    } catch (err) {
        return [];
    }
}

async function getOutputSources(output: BuildOutput) {
    const sources = await Promise.all(output.outputs.map(getArtifactSources));
    return new Set(sources.flat().map(absolute));
}

function getInputSources(config: BuildConfig) {
    return config.entrypoints.map((entrypoint) => absolute(entrypoint));
}

async function getSources(config: BuildConfig, output: BuildOutput) {
    return new Set([...getInputSources(config), ...(await getOutputSources(output))]);
}

async function triggerBuild(config: BuildConfig) {
    try {
        return await Bun.build(config);
    } catch (e) {
        const error = e as AggregateError;
        console.error("[BUN BUILD] Build Failed", error);
    }
}

type BuildConfig = BunBuildConfig & {
    watch?: string;
    onBuild?: (output: BuildOutput) => void;
};

export async function build(config: BuildConfig) {
    let { watch, onBuild, sourcemap = "external", ...rest } = config;
    if (watch && config.sourcemap !== "external" && config.sourcemap !== "linked") {
        console.error("Watch requires external / linked sourcemap to be set.");
    }
    let output = await Bun.build({ ...rest, sourcemap });

    if (watch) {
        let sources = await getSources(config, output);
        let debounce: Timer | null = null;
        let pending = false;

        const rebuild = async (filename: string) => {
            if (pending) return;
            console.log("[BUN BUILD] File change:", filename);
            pending = true;

            try {
                output = await Bun.build({ ...rest, sourcemap });
                sources = await getSources(config, output);
                onBuild && onBuild(output);
            } catch (e) {
                const error = e as AggregateError;
                console.error("[BUN BUILD] Build Failed", error);
            }

            pending = false;
        };

        fs.watch(watch, { recursive: true }, (event, filename) => {
            if (!filename) return;
            const source = absolute(join(watch, filename));
            if (!sources.has(source)) return;
            if (debounce) clearTimeout(debounce);
            debounce = setTimeout(() => rebuild(filename), 50);
        });
    }

    onBuild && onBuild(output);
    return output;
}

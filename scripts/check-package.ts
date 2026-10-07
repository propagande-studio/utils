import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { effectScope } from "vue";

// This also accepts an unpacked npm archive to verify the published files.
const directory = resolve(process.argv[2] ?? ".");
const manifest = JSON.parse(await readFile(resolve(directory, "package.json"), "utf8"));
for (const entry of Object.values(manifest.exports) as Record<string, string>[]) {
    for (const path of new Set(Object.values(entry))) await readFile(resolve(directory, path));
}

async function load(entry: string) {
    return import(pathToFileURL(resolve(directory, manifest.exports[entry].import)).href);
}

const [shared, sharedAlias, voir, gsap] = await Promise.all([load("."), load("./shared"), load("./voir"), load("./gsap")]);
assert.equal(shared.P.Lerp(0, 10, 0.5), 5);
assert.equal(typeof gsap.SplitTextAnimator, "function");
assert.equal(shared.getTicker, sharedAlias.getTicker);
assert.equal(shared.getViewport, sharedAlias.getViewport);

// A compositor subscribing through /voir must use the root export's ticker.
const ticker = shared.getTicker();
const originalAdd = ticker.add;
const originalRemove = ticker.remove;
const handler = () => {};
let subscribed = false;
let disposed = false;
const scope = effectScope();
try {
    ticker.add = (fn: unknown, ...args: unknown[]) => {
        if (fn === handler) subscribed = true;
        return originalAdd.call(ticker, fn, ...args);
    };
    ticker.remove = (fn: unknown) => {
        if (fn === handler) disposed = true;
        return originalRemove.call(ticker, fn);
    };
    scope.run(() => {
        voir.useFrame(handler);
        voir.useResize((_size: unknown, viewport: unknown) => {
            assert.equal(viewport, shared.getViewport(), "voir must use the shared viewport");
        });
    });
    assert.ok(subscribed, "voir must subscribe to the shared ticker");
    scope.stop();
    assert.ok(disposed, "disposing the scope must remove the ticker subscription");
} finally {
    scope.stop();
    ticker.add = originalAdd;
    ticker.remove = originalRemove;
}

console.log(`Verified ${manifest.name}@${manifest.version}: exports, shared ticker, shared viewport, and disposal`);

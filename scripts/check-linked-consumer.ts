import assert from "node:assert/strict";
import { lstat, mkdir, mkdtemp, readFile, readdir, realpath, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const repository = resolve(import.meta.dir, "..");
const destination = await mkdtemp(join(tmpdir(), "propagande-utils-link-"));
const manifest = JSON.parse(await readFile(join(repository, "package.json"), "utf8"));
const results: { name: string; project: string; linkedTo: string }[] = [];
const bunfig = `[install]\nglobalDir = ${JSON.stringify(join(destination, "bun-global"))}\nglobalBinDir = ${JSON.stringify(join(destination, "bun-bin"))}\n`;

async function run(args: string[], cwd: string) {
    const process = Bun.spawn(args, { cwd, stdout: "inherit", stderr: "inherit" });
    if (await process.exited !== 0) throw new Error(`Failed: ${args.join(" ")} in ${cwd}`);
}

console.log(`Independent consumer projects: ${destination}`);
await run([process.execPath, "pm", "pack", "--ignore-scripts", "--quiet", "--filename", join(destination, "utils.tgz")], repository);

for (const name of ["@propagande/utils", "@propagande-studio/utils"]) {
    const project = join(destination, name === "@propagande/utils" ? "npm" : "github");
    const localPackage = join(project, "local-package");
    await mkdir(localPackage, { recursive: true });
    await run(["tar", "-xzf", join(destination, "utils.tgz"), "-C", localPackage, "--strip-components=1"], repository);
    const publishedManifest = JSON.parse(await readFile(join(localPackage, "package.json"), "utf8"));
    publishedManifest.name = name;
    await writeFile(join(localPackage, "package.json"), `${JSON.stringify(publishedManifest, null, 4)}\n`);
    await writeFile(join(localPackage, "bunfig.toml"), bunfig);
    await writeFile(join(project, "bunfig.toml"), bunfig);
    await writeFile(join(project, "package.json"), JSON.stringify({
        name: `utils-${name === "@propagande/utils" ? "npm" : "github"}-consumer`,
        private: true,
        type: "module",
        dependencies: { gsap: manifest.devDependencies.gsap, vue: manifest.devDependencies.vue },
        devDependencies: { typescript: "5.9.3", "@types/bun": "1.4.2" },
    }, null, 4));
    await writeFile(join(project, "tsconfig.json"), JSON.stringify({
        compilerOptions: { target: "ESNext", module: "ESNext", moduleResolution: "bundler", strict: true, skipLibCheck: true, noEmit: true },
        include: ["*.ts"],
    }, null, 4));
    for (const file of await readdir(join(repository, "fixtures/linked-consumer"))) {
        const source = await readFile(join(repository, "fixtures/linked-consumer", file), "utf8");
        await writeFile(join(project, file.replace(/\.fixture$/, "")), source.replaceAll("@propagande/utils", name));
    }
    await run([process.execPath, "link"], localPackage);
    await run([process.execPath, "install", "--ignore-scripts", "--cache-dir", join(repository, ".bun-cache")], project);
    await run([process.execPath, "link", "--save", "--ignore-scripts", name], project);
    const installed = join(project, "node_modules", name);
    assert.ok((await lstat(installed)).isSymbolicLink(), "bun link must create a real symlink");
    assert.equal(await realpath(installed), await realpath(localPackage));
    const consumerManifest = JSON.parse(await readFile(join(project, "package.json"), "utf8"));
    assert.equal(consumerManifest.dependencies[name], `link:${name}`);
    await run([process.execPath, "test", "runtime.test.ts"], project);
    await run([process.execPath, "run", "node_modules/typescript/bin/tsc", "--project", "tsconfig.json"], project);
    await run([process.execPath, "build", "browser.ts", "--target", "browser", "--outdir", "build"], project);
    await writeFile(join(project, "build/index.html"), `<!doctype html><html><meta charset="utf-8"><title>${name} consumer test</title><body>Running ${name}…<script type="module" src="./browser.js"></script></body></html>`);
    results.push({ name, project, linkedTo: await realpath(installed) });
}

await writeFile(join(destination, "results.json"), `${JSON.stringify({ bun: Bun.version, results }, null, 2)}\n`);
console.log(`PASS: both linked consumers; browser projects and results retained in ${destination}`);

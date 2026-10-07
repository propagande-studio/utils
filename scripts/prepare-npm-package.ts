import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

// GitHub Packages requires the GitHub organization scope. npm uses a different organization.
const githubName = "@propagande-studio/utils";
const npmName = "@propagande/utils";
const destination = resolve("work/npm-package");
const manifest = JSON.parse(await readFile("package.json", "utf8"));

if (manifest.name !== githubName) throw new Error(`Expected package name ${githubName}`);
// Check the build before clearing the previous prepared package.
for (const entry of Object.values(manifest.exports) as Record<string, string>[]) {
    for (const path of new Set(Object.values(entry))) await readFile(path);
}

await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
for (const path of [...manifest.files, "README.md", "LICENSE"]) {
    await cp(path, join(destination, path), { recursive: true });
}

async function rewriteScope(directory: string) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) {
            await rewriteScope(path);
        } else if (/\.(js|ts|json|map)$/.test(entry.name)) {
            const content = await readFile(path, "utf8");
            await writeFile(path, content.replaceAll(githubName, npmName));
        }
    }
}

await rewriteScope(destination);
const readme = (await readFile("README.md", "utf8"))
    .replace(/GitHub Packages continues to publish[^]*?(?=\n## Table of Contents)/, "")
    .replace(/\n## Publishing[^]*/, "")
    .replaceAll(githubName, npmName);
await writeFile(join(destination, "README.md"), readme);
manifest.name = npmName;
manifest.publishConfig = { registry: "https://registry.npmjs.org", access: "public" };
// These apply to the source checkout, not the installable package.
for (const field of ["scripts", "workspaces", "packageManager", "devDependencies", "overrides"]) delete manifest[field];
await writeFile(join(destination, "package.json"), `${JSON.stringify(manifest, null, 4)}\n`);
console.log(`Prepared ${npmName}@${manifest.version} in ${destination}`);

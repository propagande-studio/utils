// This script generates TypeScript declaration files for GSAP plugins
// to avoid issues with module resolution.
// It creates a shim for each plugin, allowing TypeScript to recognize them

const plugins = ["ScrollTrigger", "MotionPathPlugin", "Draggable", "ScrollSmoother", "Flip", "SplitText"]; // List of GSAP plugins to generate shims for

const output = plugins
    .map((name) =>
        `
declare module 'gsap/${name}.js' {
    import ${name} from 'gsap/${name}';
    export default ${name};
}`.trim()
    )
    .join("\n\n");

await Bun.write("types/gsap-shims.d.ts", output);

console.log("✅ GSAP shims generated in types/gsap-shims.d.ts");

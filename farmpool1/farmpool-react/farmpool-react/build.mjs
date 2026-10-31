// Bundles the React app (src/main.jsx) into public/app.js + public/app.css.
//   node build.mjs           one-off production build
//   node build.mjs --watch   rebuild whenever a file in src/ changes
import * as esbuild from "esbuild";

const watch = process.argv.includes("--watch");

const options = {
  entryPoints: ["src/main.jsx"],
  bundle: true,
  outfile: "public/app.js", // CSS imported from JS comes out as public/app.css
  jsx: "automatic",
  target: ["es2020"],
  minify: !watch,
  sourcemap: watch,
  define: { "process.env.NODE_ENV": JSON.stringify(watch ? "development" : "production") },
  logLevel: "info",
};

if (watch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  console.log("Watching src/ for changes…");
} else {
  await esbuild.build(options);
}

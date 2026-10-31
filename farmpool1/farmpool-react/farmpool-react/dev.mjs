// `npm run dev`: rebuilds the frontend on every save AND restarts the server
// when server/ files change. Press Ctrl+C once to stop both.
import { spawn } from "node:child_process";

const run = (args) => spawn(process.execPath, args, { stdio: "inherit" });
const children = [run(["build.mjs", "--watch"]), run(["--watch", "server/index.js"])];

const stop = () => children.forEach((c) => c.kill());
process.on("SIGINT", () => { stop(); process.exit(0); });
process.on("SIGTERM", () => { stop(); process.exit(0); });
children.forEach((c) => c.on("exit", (code) => { if (code) { stop(); process.exit(code); } }));

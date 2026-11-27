import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import json from "@rollup/plugin-json";
import terser from "@rollup/plugin-terser";

const dev = process.env.ROLLUP_WATCH;

export default {
  input: "src/simple-vertical-slider.ts",
  output: {
    file: "simple-vertical-slider.js",
    format: "es",
    inlineDynamicImports: true,
    sourcemap: false,
  },
  plugins: [
    resolve(),
    commonjs(),
    typescript({ tsconfig: "./tsconfig.json" }),
    json(),
    !dev && terser({ format: { comments: false } }),
  ],
};

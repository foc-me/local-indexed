const typescript = require("@rollup/plugin-typescript")
const terser = require("@rollup/plugin-terser")
const copy = require("rollup-plugin-copy")
const pick = require("@focme/rollup-plugin-pick")
const package = require("./package.json")

const banner = `/**
 * localIndexed v${package.version}
 * @License MIT
 * Copyright (c) 2024 - present Fat Otaku Team
 **/`

module.exports = {
    input: "./src/index.ts",
    output: [
        { dir: "./dist/esm", format: "esm", banner },
        { dir: "./dist/dist", format: "umd", name: "localIndexed", banner }
    ],
    plugins: [
        typescript({ outDir: null, declaration: false, declarationDir: null }),
        terser(),
        copy({
            targets: [{
                src: ["./readme.md", "./LICENSE"],
                dest: "./dist"
            }]
        }),
        pick([
            "name",
            "version",
            ["main", "dist/index.js"],
            ["module", "esm/index.js"],
            ["types", "type"],
            "description",
            "keywords",
            ["files", ["dist", "esm", "type", "LICENSE", "package.json", "readme.md"]],
            "author",
            "repository",
            "license"
        ])
    ]
}
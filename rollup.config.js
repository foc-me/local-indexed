const typescript = require("@rollup/plugin-typescript")
const terser = require("@rollup/plugin-terser")
const cleanup = require("rollup-plugin-cleanup")
const copy = require("rollup-plugin-copy")
const pick = require("@focme/rollup-plugin-pick")
const package = require("./package.json")

const banner = `/**
 * ${package.name} v${package.version}
 * @license MIT
 * Copyright (c) 2024 - present Fat Otaku Team
 **/`

const globalName = "localIndexed"
const typescriptPlugin = () => {
    return typescript({
        outDir: null,
        declaration: false,
        declarationDir: null
    })
}

module.exports = [
    {
        input: "./src/index.ts",
        output: {
            file: `./dist/release/${globalName}.${package.version}.umd.js`,
            format: "umd",
            name: globalName,
            banner
        },
        plugins: [
            typescriptPlugin(),
            cleanup({ extensions: "ts" })
        ]
    },
    {
        input: "./src/index.ts",
        output: {
            file: `./dist/release/${globalName}.${package.version}.umd.min.js`,
            format: "umd",
            name: globalName,
            banner
        },
        plugins: [
            typescriptPlugin(),
            terser()
        ]
    },
    {
    input: "./src/index.ts",
    output: [
        { dir: "./dist/esm", format: "esm", banner },
        { dir: "./dist/dist", format: "cjs", banner }
    ],
    plugins: [
        typescriptPlugin(),
        cleanup({ extensions: "ts" }),
        copy({
            targets: [{
                src: ["./readme.md", "./LICENSE"],
                dest: "./dist"
            }]
        }),
        pick([
            "name",
            "version",
            "description",
            "keywords",
            ["main", "./dist/index.js"],
            ["module", "./esm/index.js"],
            ["types", "./type/index.d.ts"],
            ["exports", {
                ".": {
                    types: "./type/index.d.ts",
                    import: "./esm/index.js",
                    require: "./dist/index.js"
                }
            }],
            ["files", ["dist", "esm", "type", "LICENSE", "package.json", "readme.md"]],
            "author",
            "repository",
            "license"
        ])
    ]
}]
# Hybrid ESM/CJS modules in TypeScript

Generating and using hybrid node modules targeting both CommonJS/CJS and ECMAScript modules/ESM is difficult to do correct in a way that these modules are also usable from within node.

This repo provides a working example of how to achieve this in TypeScript (based on a [previous example by @demurgos](https://github.com/demurgos/mjts)).

## Why?

You need to always have support for "legacy" CommonJS modules, but to make the most out of modern tooling like `rollup`, you also want to publish ES modules, so these tools can work their magic and reduce bundle sizes.

## Gotchas

First of all, in order to publicly export a CJS and ESM entrypoint, you need to supply `main` (CJS or hybrid entrypoint), `module` (ESM entry point), `browser` (CJS entry point), and `types` for correct TypeScript type export in your `package.json`.

However, node does not accept standard `.js` files as ESM modules, but you need to either supply a loader script that handles module type detection (slow, potentially error prone) or change the filenames of all ES modules to `.mjs`, which node natively recognises as ESM modules.

TypeScript unfortunately does not support renaming output files, so this needs to be done manually.

Finally, importing the modules correctly requires different compiler arguments (see below).

## Structure

The [`hybrid`](./hybrid) directory contains a hybrid CJS/ESM module ([`package.json`](./hybrid/package.json)) that just exports a single function. The function prints a string and returns a boolean indicating whether this function was executed in CJS or ESM.

It gets imported by our main repo ([`package.json`](./package.json)), and the exported function gets used. This app just prints a few strings and finally whether the imported module was an ES or CJS module.

## Detecting CJS vs ESM

In ESM, the `exports` variable does not exist, since exports are handled via the `export` keyword. Hence, whether or not this variable is undefined tells us if the executing context is ESM or CJS.

## Install

Install the dependencies of the hybrid module, build it, then install the dependencies in the main repo.

```sh
cd hybrid && npm install && npm run build && cd .. && npm install
```

## Build config

Any ES modules need to be renamed to `.mjs` or node.js will fail to recognise them as such and throw errors.

### Building hybrid apps

From the main project [`package.json`](./package.json):

```json
{
  "scripts": {
    "build:mjs": "tsc --rootDir src --outDir build/mjs --moduleResolution node --allowSyntheticDefaultImports --module esnext src/*.ts && mv build/mjs/index.js build/mjs/index.mjs",
    "build:cjs": "tsc --rootDir src --outDir build/cjs --moduleResolution node --esModuleInterop src/*.ts",
  }
}
```

For regular applications, it's a good idea to split CJS and ESM output into different directories, because they will be used separately anyway. In both cases, you want `moduleResolution` set to `node`.

To build an ES module app (that can also work with CJS modules), you need to enable the option `allowSyntheticDefaultImports` and set the `module` compiler option to `esnext`.

To build a CommonJS module app (that can also work with ES modules), you need to enable the option `esModuleInterop`.

### Building hybrid packages

From the hybrid package [`package.json`](./hybrid/package.json):

```json
{
  "main": "./dist/hybrid",
  "types": "./dist/hybrid.d.ts",
  "browser": "./dist/hybrid.js",
  "module": "./dist/hybrid.mjs",
  "scripts": {
    "build:mjs": "tsc --allowSyntheticDefaultImports --module esnext && npm run move-esm-output && npm run process-source-maps",
    "move-esm-output": "mv dist/hybrid.js dist/hybrid.mjs && mv dist/say-hello.js dist/say-hello.mjs",
    "process-source-maps": "sed -e \"s/hybrid.js/hybrid.mjs/g\" ./dist/hybrid.js.map > ./dist/hybrid.mjs.map && sed -e \"s/say-hello.js/say-hello.mjs/g\" ./dist/say-hello.js.map > ./dist/say-hello.mjs.map",
    "build:cjs": "tsc --esModuleInterop",
    "build": "npm run build:mjs && npm run build:cjs"
  }
```

First of all, if no file extension is specified in the `main` field, the module loader can choose the desired from the available options at the path. If the module loader is configured to preferably load ES modules, then the `.mjs` file will be loaded if it exists, otherwise the `.js` at the spot will be loaded as a CJS module.

A hybrid module will have a `.js` and a `.mjs` version of each file in the module.

The build process for the ES module files is as follows:

* Build the ES module with typescript: This generates `.js` code files and `.js.map` source map files. Note that you need to specify `--allowSyntheticDefaultImports` and `--module esnext` as compiler options.
* Rename all generated `.js` files to `.mjs` (see the `move-esm-output` task above)
* Parse all source map files and rename the target filename inside from the `.js` version to `.mjs`. Then output the replaced code at the same path ending in `.mjs.map` (see process-source-maps task above).

The build process for CJS module files is simpler and **it should be run after the ES module code has been generated and post-processed** (i.e. **not in parallel**). You only need to run `tsc` with the additional compiler option `--esModuleInterop`.

The final result will be, the following set of files for each individual source TypeScript source file / module (using the example file `<some_path>/filename.ts`):

* `<some_path>/filename.d.ts`: The TypeScript definition file.
* `<some_path>/filename.js`: The CommonJS version of the module
* `<some_path>/filename.js.map`: the source map of the CommonJS module.
* `<some_path>/filename.mjs`: The ESM version of the module
* `<some_path>/filename.mjs.map`: the source map of the ES module.

#### Minor gotcha

Technically, in ES modules, you need to specify the full file path of an import (according to the spec). Within node, this is not necessary though, if an `.mjs` file exists at that location. On the browser side, this will not work, so you should post-process your output further to rewrite the paths to fully qualified paths including extension. Alternatively, you could reconfigure the module loader to search at the appropriate locations.

The easiest option though is probably to just bundle up all the output using an ESM-aware bundler like *rollup*.

## Running hybrid apps

From the main project [`package.json`](./package.json):

```json
{
  "scripts": {
    "start:mjs": "npm run build:mjs && node --experimental-modules build/mjs/index.mjs",
    "start:cjs": "npm run build:cjs && node build/cjs/index.js"
  }
}
```

To start node using CommonJS, you don't need to do anything and can just run `node <PATH_TO_TARGET>.js`.

To start node using/supporting ES modules, you need to (currently) supply the `--experimental-modules` option and then a path to the entrypoint `.mjs` file (`node --experimental-modules <PATH_TO_TARGET>.mjs`).

## License

[MIT License](./LICENSE.md)

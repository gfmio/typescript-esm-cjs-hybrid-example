"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var hybrid_1 = require("hybrid");
var path_1 = __importDefault(require("path"));
function run() {
    console.log("ESM is getting real");
    console.log(path_1["default"].posix.join("i", "can", "use", "cjs", "modules"));
    console.log("And hybrid modules:");
    console.log("This was generated in a " + (hybrid_1.sayHello() ? "ES" : "CJS") + " module.");
}
run();

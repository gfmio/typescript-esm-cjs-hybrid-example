import { sayHello } from "hybrid";
import path from "path";
function run() {
    console.log("ESM is getting real");
    console.log(path.posix.join("i", "can", "use", "cjs", "modules"));
    console.log("And hybrid modules:");
    console.log("This was generated in a " + (sayHello() ? "ES" : "CJS") + " module.");
}
run();

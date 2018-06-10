
/**
 * Prints "Hello, World!"
 * @returns whether this function was executed in a CommonJS context or in an ES module
 */
export function sayHello(): boolean {
    console.log("Hello, World!");

    // The exports variable will be undefined in an ES module, but not in CommonJS
    // So, we can use it to discriminate between CommonJS and ES modules
    return typeof exports === "undefined";
}

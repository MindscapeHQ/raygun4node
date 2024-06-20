// Humanize only one level deep
const maxLevels = 1;
const symbolSeparator = ", ";
const symbolEqual = "=";

/**
 * Humanize error objects with the following conditions:
 * - Keeps the output to a single line
 * - Maximum one level deep
 *
 * Example:
 * - Object "{ name: "Test" }" becomes string "name=Test" as all is the top level
 * - Object "{ one: { name: "Test" }}" becomes string "one={name=Test}" as one level deep is explored
 * - Object "{ one: { two: { name: "Test" }}}" becomes string "one={two=...}" as the max level deep is reached
 *
 * @param obj input object to stringify
 * @param level level of recursion, should start at 0
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function humanString(obj: any, level: number = 0): string {
  if (!obj) {
    return "null";
  }

  // Not an object, attempt to stringify
  if (typeof obj !== "object") {
    return String(obj);
  }

  // Maximum deep levels reached
  // return String instead of exploring object
  if (level > maxLevels) {
    return "...";
  }

  let out = "";

  // Iterate over all object properties
  Object.keys(obj).forEach(function (key) {
    // Recursive call increases level
    out +=
      symbolSeparator + key + symbolEqual + humanString(obj[key], level + 1);
  });

  // Remove the initial `, ` before return
  const cleanOutput = out.substring(symbolSeparator.length);

  // Surround deeper levels with { }
  if (level > 0) {
    return `{${cleanOutput}}`;
  } else {
    return cleanOutput;
  }
}

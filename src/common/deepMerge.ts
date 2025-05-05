/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Recursively merges the properties of one or more source objects into a target object.
 *
 * @param target - The object to merge properties into.
 * @param sources - The source objects to merge from.
 * @returns A new object with the merged properties.
 */
export function deepMerge<T extends object>(target: T, ...sources: any[]): T {
  if (!sources.length) {
    return target;
  }

  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    const output = { ...target } as T; // Create a shallow copy to avoid mutating the original target

    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        if (isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = deepMerge(target[key], source[key]);
          }
        } else if (
          Array.isArray(source[key]) &&
          Array.isArray((target as any)[key])
        ) {
          // Concatenate arrays. You might want a different strategy here (e.g., merging objects within arrays by ID)
          (output as any)[key] = [...(target as any)[key], ...source[key]];
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      }
    }
    return deepMerge(output, ...sources); // Merge the rest of the sources
  } else {
    // If target or source is not an object (or different types),
    // the source value overwrites the target value
    return source;
  }
}

/**
 * Checks if an item is a plain object (excluding arrays, null, and other object types like Date).
 *
 * @param item - The item to check.
 * @returns True if the item is a plain object, false otherwise.
 */
function isObject(item: any): boolean {
  return (
    item && typeof item === "object" && !Array.isArray(item) && item !== null
  );
}

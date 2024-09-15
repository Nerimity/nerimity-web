// operators --> modify existing Colors
import "chroma-js/src/ops/alpha.js";
import "chroma-js/src/ops/clipped.js";
import "chroma-js/src/ops/get.js";
import "chroma-js/src/ops/luminance.js";
import "chroma-js/src/ops/mix.js";

// interpolators
import "chroma-js/src/interpolator/rgb.js";
import "chroma-js/src/interpolator/lrgb.js";

// generators -- > create new colors
import average from "chroma-js/src/generator/average.js";

export default average;

export * from "chroma-js/src/io/css/index.js";
export * from "chroma-js/src/io/hex/index.js";
export * from "chroma-js/src/io/rgb/index.js";

export const convertShorthandToLinearGradient = (shorthand: string) => {
  const parts = shorthand.trim().split(/\s+/);

  // Validation: Needs at least 3 parts (Start, Middle, End) for 2 colors
  // 2 colors = 3 parts ("lg0#..." "0#..." "100")
  // 3 colors = 4 parts
  // 4 colors = 5 parts
  if (parts.length < 3 || parts.length > 5) {
    return [null, "Error: Invalid format (must represent 2-4 colors)"] as const;
  }

  // 1. Parse First Chunk (lg + Degree + Hex1)
  // Example: "lg0#2a7b9b" -> Deg: 0, Hex: #2a7b9b
  const startMatch = parts[0]?.match(/^lg(\d+)(#[a-f0-9]{3,6})$/i);
  if (!startMatch)
    return [null, "Invalid start format (e.g., lg0#ffffff)"] as const;

  const degree = startMatch[1];
  const colors = [startMatch[2]]; // Start collecting hexes
  const stops: string[] = []; // Start collecting stops

  // 2. Parse Middle Chunks (Stop + Hex)
  // Example: "0#c5f3d8" -> Stop: 0, Hex: #c5f3d8
  for (let i = 1; i < parts.length - 1; i++) {
    const middleMatch = parts[i]?.match(/^(\d+)(#[a-f0-9]{3,6})$/i);
    if (!middleMatch)
      return [null, `Invalid middle format at part ${i + 1}`] as const;

    stops.push(middleMatch[1]!); // Stop for previous color
    colors.push(middleMatch[2]); // Hex for current color
  }

  // 3. Parse Last Chunk (Final Stop)
  // Example: "100"
  const endMatch = parts[parts.length - 1]?.match(/^(\d+)$/);
  if (!endMatch)
    return [null, "Invalid end format (must be a number)"] as const;

  stops.push(endMatch[1]!);

  // 4. Combine into CSS String
  // We zip the colors and stops arrays together
  const cssStops = colors.map((hex, i) => `${hex} ${stops[i]}%`).join(", ");

  return [
    { gradient: `linear-gradient(${degree}deg, ${cssStops})`, colors },
    null,
  ] as const;
};

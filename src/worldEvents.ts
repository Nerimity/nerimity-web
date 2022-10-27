
const halloweenStart = 1666652400000;
const halloweenEnd = 1667343600000;
const now = Date.now();

export const isHalloween = now > halloweenStart && now < halloweenEnd;
interface Event {
  start: { day: number; month: number };
  dayDuration: number;
}

const halloween = {
  start: { day: 25, month: 10 },
  dayDuration: 9
};
const christmas = {
  start: { day: 23, month: 12 },
  dayDuration: 13
};

const now = Date.now();

export const isHalloween = isEventActive(halloween);
export const isChristmas = false;

function isEventActive({ start, dayDuration }: Event) {
  const startDate = new Date();
  startDate.setDate(start.day);
  startDate.setMonth(start.month - 1);
  startDate.setHours(0);
  startDate.setMinutes(0);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + dayDuration);
  endDate.setHours(23);
  endDate.setMinutes(59);

  if (startDate.getFullYear() !== endDate.getFullYear()) {
    endDate.setFullYear(startDate.getFullYear());
    startDate.setFullYear(startDate.getFullYear() - 1);
  }

  return now > startDate.getTime() && now < endDate.getTime();
}

export const appLogoUrl = () => {
  // if (isHalloween) return "/assets/halloween-logo.png";
  // if (isChristmas) return "/assets/christmas-logo.png";
  return "/assets/logo.png";
};

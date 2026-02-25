import { useLocalStorage, StorageKeys } from "@/common/localStorage";
import { getCurrentLanguageISO } from "@/locales/languages";
import { Temporal, Intl } from "temporal-polyfill";
import { t } from "@nerimity/i18lite";
import { createMemo } from "solid-js";

export const [timeFormat, setTimeFormat] = useLocalStorage<"12hr" | "24hr">(
  StorageKeys.TIME_FORMAT,
  "24hr",
  true
);

export const formatters = createMemo(() => {
  const lang = getCurrentLanguageISO();
  return {
    duration: {
      long: new Intl.DurationFormat(lang, {
        style: "long",
      }),
      narrow: new Intl.DurationFormat(lang, {
        style: "narrow",
      }),
      narrowForceSeconds: new Intl.DurationFormat(lang, {
        style: "narrow",
        secondsDisplay: "always",
      }),
      // H:MM:SS or MM:SS
      digital: new Intl.DurationFormat(lang, {
        style: "narrow",
        hoursDisplay: "auto",
        hours: "numeric",
        minutes: "2-digit",
        seconds: "2-digit",
      }),
      // H:MM:SS or M:SS
      digitalShort: new Intl.DurationFormat(lang, {
        style: "narrow",
        hoursDisplay: "auto",
        hours: "numeric",
        minutes: "numeric",
        seconds: "2-digit",
      }),
    },
    relative: new Intl.RelativeTimeFormat(lang, {
      numeric: "auto",
    }),
  };
});

/**
 * Round a duration to two significant units.
 */
function roundDuration(
  duration: Temporal.Duration,
  start?: Temporal.ZonedDateTime,
  options?: {
    useWeeks?: boolean;
    largestUnit?: Temporal.LargestUnit<Temporal.DateTimeUnit>;
    roundingMode?: Temporal.RoundingMode;
    roundingIncrement?: number;
  },
) {
  if (options?.largestUnit) {
    // Ensure the duration is balanced (turn 150s to 2m 30s)
    duration = duration.round({
      relativeTo: start,
      largestUnit: options.largestUnit,
    });
  }

  if (options?.useWeeks) {
    duration = duration.with({
      weeks: duration.weeks + Math.floor(duration.days / 7),
      days: duration.days % 7,
    });
  }

  const baseDuration = duration;
  if (duration.sign === -1) {
    duration = duration.negated();
  }

  let smallestUnit: Temporal.SmallestUnit<Temporal.DateTimeUnit>;
  let secondsOnly = false;
  if (duration.years > 0) {
    smallestUnit = "months";
  } else if (duration.months > 0) {
    smallestUnit = options?.useWeeks ? "weeks" : "days";
  } else if (duration.weeks > 0) {
    smallestUnit = "days";
  } else if (duration.days > 0) {
    smallestUnit = "hours";
  } else if (duration.hours > 0) {
    smallestUnit = "minutes";
  } else if (duration.minutes > 0) {
    smallestUnit = "seconds";
  } else {
    secondsOnly = true;
    smallestUnit = "seconds";
  }

  const rounded = baseDuration.round({
    relativeTo: start,
    smallestUnit,
    ...options
  });
  return {
    duration: rounded,
    secondsOnly,
  };
}

// make a function where if the number is less than 10, it will add a 0 in front of it

function pad(num: number) {
  return num < 10 ? `0${num}` : num;
}

// convert timestamp to today at 13:00 or yesterday at 13:00 or date. add zero if single digit
export function formatTimestamp(timestamp: number, seconds = false) {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const sameYear = today.getFullYear() === date.getFullYear();
  const format = timeFormat(); 

  const hours = date.getHours();
  const minutes = pad(date.getMinutes());
  const secondsText = seconds ? `:${pad(date.getSeconds())}` : "";

  let formattedHours: string | number = hours;
  let ampm = "";

  if (format === "12hr") {
    ampm = hours >= 12 ? " PM" : " AM";
    formattedHours = hours % 12 || 12;
  }

  if (format === "24hr") {
    formattedHours = pad(hours);
  }

  if (
    sameYear &&
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth()
  ) {
    return `${formattedHours}:${minutes}${secondsText}${ampm}`;
  } else if (sameYear && yesterday.toDateString() === date.toDateString()) {
    return `Yesterday at ${formattedHours}:${minutes}${ampm}`;
  } else {
    return `${Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date)} at ${formattedHours}:${minutes}${ampm}`;
  }
}

export const fullDate = (timestamp: number) => {
  return Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(timestamp);
};

export function getDaysAgo(timestamp: number) {
  const now = Temporal.Now.zonedDateTimeISO();
  const start = Temporal.Instant.fromEpochMilliseconds(timestamp)
    .toZonedDateTimeISO(now.timeZoneId);
  const elapsed = start.until(now, {
    smallestUnit: "day",
  });
  return formatters().relative.format(-elapsed.days, "day");
}

/**
 * Format the duration since a timestamp with a single significant unit;
 * falls back to using `formatTimestamp` if the duration is greater than
 * a day unless `timestampFallback` is `false`.
 */
export function timeSince(
  timestamp: number,
  timestampFallback = true,
) {
  const now = Temporal.Now.zonedDateTimeISO();
  const start = Temporal.Instant.fromEpochMilliseconds(timestamp)
    .toZonedDateTimeISO(now.timeZoneId);
  const elapsed = start.until(now, {
    largestUnit: "day",
    roundingMode: "trunc",
  });

  if (elapsed.days < 1 || !timestampFallback) {
    const formatter = formatters().relative;
    if (elapsed.days) {
      return formatter.format(-elapsed.days, "day");
    } else if (elapsed.hours) {
      return formatter.format(-elapsed.hours, "hour");
    } else if (elapsed.minutes) {
      return formatter.format(-elapsed.minutes, "minute");
    } else {
      return t("datetime.lessThanAMinuteAgo");
    }
  } else {
    return formatTimestamp(timestamp);
  }
}

/**
 * Formats the duration since a timestamp as a digital clock, rounding down.
 */
export function timeSinceDigital(timestamp: number) {
  const now = Temporal.Now.instant();
  const start = Temporal.Instant.fromEpochMilliseconds(timestamp);
  const elapsed = start.until(now, {
    largestUnit: "hour",
    smallestUnit: "second",
    roundingMode: "floor",
  });
  return formatters().duration.digital.format(elapsed);
}

export function formatMillisElapsedDigital(milliseconds: number) {
  const duration = Temporal.Duration.from({ milliseconds });
  const rounded = duration.round({
    largestUnit: "hour",
    smallestUnit: "second",
    roundingMode: "floor",
  });
  return formatters().duration.digitalShort.format(rounded);
}

/**
 * Formats a remaining duration with narrow units, rounding up.
 * This will return "0s" when the duration is empty.
 */
export function formatMillisRemainingNarrow(millis: number) {
  const duration = Temporal.Duration.from({ milliseconds: millis });
  const rounded = roundDuration(duration, undefined, {
    roundingMode: "ceil",
    largestUnit: "hour",
  });
  const formatter = rounded.secondsOnly
    ? formatters().duration.narrowForceSeconds
    : formatters().duration.narrow;
  return formatter.format(rounded.duration);
}

export function calculateTimeElapsedForActivityStatus(
  startTime: number,
  music = false,
  speed = 1,
  updatedAt?: number
) {
  if (music) {
    return activityMusicTimeElapsed(startTime, speed, updatedAt);
  }
  return activityStatusDuration(startTime);
}

function activityMusicTimeElapsed(
  timestamp: number,
  speed = 1,
  updatedAt?: number
) {
  const ms = Date.now() - timestamp;
  let seconds = ms / 1000;

  if (updatedAt) {
    const seekedSeconds = (updatedAt - timestamp) / 1000;
    const seekedSecondsWithSpeed = seekedSeconds * speed;
    const seekedSpeed = -(seekedSeconds - seekedSecondsWithSpeed);
    seconds = seconds * speed - seekedSpeed;
  }
  return formatMillisElapsedDigital(seconds * 1000);
}

function activityStatusDuration(startTime: number) {
  const now = Temporal.Now.zonedDateTimeISO();
  const start = Temporal.Instant.fromEpochMilliseconds(startTime)
    .toZonedDateTimeISO(now.timeZoneId);
  let elapsed = start.until(now, {
    largestUnit: "years",
  });

  if (elapsed.sign == -1) {
    elapsed = new Temporal.Duration();
  }
  const rounded = roundDuration(elapsed, start, { useWeeks: true });

  const formatter = rounded.secondsOnly
    ? formatters().duration.narrowForceSeconds
    : formatters().duration.narrow;
  return formatter.format(rounded.duration);
}

type RelativeMode = "instant" | "duration" | "none";

/**
 * Formats a timestamp as a relative offset to the current time.
 */
export function formatTimestampRelative(
  timestamp: number,
  mode?: RelativeMode,
) {
  const now = Temporal.Now.zonedDateTimeISO();
  const start = Temporal.Instant.fromEpochMilliseconds(timestamp)
    .toZonedDateTimeISO(now.timeZoneId);
  let elapsed = start.until(now, {
    largestUnit: "years",
  });

  const inFuture = elapsed.sign == -1;
  if (inFuture) {
    elapsed = elapsed.negated();
  }
  const rounded = roundDuration(elapsed, inFuture ? now : start, { useWeeks: true });

  if (rounded.secondsOnly && rounded.duration.seconds < 1) {
    return t("datetime.relativeNow");
  }

  const duration = formatters().duration.long.format(rounded.duration);
  if (mode === "none") {
    return duration;
  } else if (mode === "duration") {
    return t("datetime.duration", { duration });
  } else if (inFuture) {
    return t("datetime.relativeFuture", { duration });
  } else {
    return t("datetime.relativePast", { duration });
  }
}

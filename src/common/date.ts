import { useLocalStorage, StorageKeys } from "@/common/localStorage";
import "@formatjs/intl-durationformat/polyfill.js";
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
        style: "long"
      }),
      narrow: new Intl.DurationFormat(lang, {
        style: "narrow"
      }),
      narrowForceSeconds: new Intl.DurationFormat(lang, {
        style: "narrow",
        secondsDisplay: "always"
      }),
      // H:MM:SS or MM:SS
      digital: new Intl.DurationFormat(lang, {
        style: "narrow",
        hoursDisplay: "auto",
        hours: "numeric",
        minutes: "2-digit",
        seconds: "2-digit"
      }),
      // H:MM:SS or M:SS
      digitalShort: new Intl.DurationFormat(lang, {
        style: "narrow",
        hoursDisplay: "auto",
        hours: "numeric",
        minutes: "numeric",
        seconds: "2-digit"
      })
    },
    datetime: {
      longDate: new Intl.DateTimeFormat(lang, {
        dateStyle: "full",
        timeStyle: "short",
        hour12: timeFormat() === "12hr"
      }),
      mediumDate: new Intl.DateTimeFormat(lang, {
        dateStyle: "medium",
        timeStyle: "short",
        hour12: timeFormat() === "12hr"
      }),
      seconds: new Intl.DateTimeFormat(lang, {
        timeStyle: "medium",
        hour12: timeFormat() === "12hr"
      })
    },
    relative: new Intl.RelativeTimeFormat(lang, {
      numeric: "auto"
    })
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
  }
) {
  if (options?.largestUnit) {
    // Ensure the duration is balanced (turn 150s to 2m 30s)
    duration = duration.round({
      relativeTo: start,
      largestUnit: options.largestUnit
    });
  }

  if (options?.useWeeks) {
    duration = duration.with({
      weeks: duration.weeks + Math.floor(duration.days / 7),
      days: duration.days % 7
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
    secondsOnly
  };
}

// Format a message timestamp
export function formatTimestamp(timestampMs: number, seconds = false) {
  try {
    const today = Temporal.Now.zonedDateTimeISO();
    const timestamp = Temporal.Instant.fromEpochMilliseconds(
      Math.round(timestampMs)
    )
      .toZonedDateTimeISO(today.timeZoneId)
      .round({
        roundingMode: "trunc",
        smallestUnit: "second"
      });

    const yesterday = today.subtract(Temporal.Duration.from({ days: 1 }));
    const date = timestamp.toPlainDate();

    const dateFormat = formatters().datetime.mediumDate;
    const timeFormatSeconds = formatters().datetime.seconds;

    if (date.equals(today.toPlainDate())) {
      const formatter = seconds ? timeFormatSeconds : dateFormat;
      return formatter.format(timestamp.toPlainTime());
    } else if (date.equals(yesterday.toPlainDate())) {
      return t("datetime.yesterdayTime", {
        time: dateFormat.format(timestamp.toPlainTime())
      });
    } else {
      return t("datetime.dateTime", {
        date: dateFormat.format(timestamp.toPlainDate()),
        time: dateFormat.format(timestamp.toPlainTime())
      });
    }
  } catch (e) {
    console.warn(e);
    return t("datetime.error");
  }
}

export const fullDate = (timestamp: number) => {
  try {
    const datetime = Temporal.Instant.fromEpochMilliseconds(
      Math.round(timestamp)
    ).toZonedDateTimeISO(Temporal.Now.timeZoneId());
    return formatters().datetime.longDate.format(datetime.toPlainDate());
  } catch (e) {
    console.warn(e);
    return t("datetime.error");
  }
};

export function getDaysAgo(timestamp: number) {
  try {
    const now = Temporal.Now.zonedDateTimeISO();
    const start = Temporal.Instant.fromEpochMilliseconds(
      Math.round(timestamp)
    ).toZonedDateTimeISO(now.timeZoneId);
    const elapsed = start.until(now, {
      smallestUnit: "day"
    });
    return formatters().relative.format(-elapsed.days, "day");
  } catch (e) {
    console.warn(e);
    return t("datetime.error");
  }
}

/**
 * Format the duration since a timestamp with a single significant unit;
 * falls back to using `formatTimestamp` if the duration is greater than
 * a day unless `timestampFallback` is `false`.
 */
export function timeSince(timestamp: number, timestampFallback = true) {
  try {
    const now = Temporal.Now.zonedDateTimeISO();
    const start = Temporal.Instant.fromEpochMilliseconds(
      Math.round(timestamp)
    ).toZonedDateTimeISO(now.timeZoneId);
    const elapsed = start.until(now, {
      largestUnit: "day",
      roundingMode: "trunc"
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
  } catch (e) {
    console.warn(e);
    return t("datetime.error");
  }
}

/**
 * Formats the duration since a timestamp as a digital clock, rounding down.
 */
export function timeSinceDigital(timestamp: number) {
  try {
    const now = Temporal.Now.instant();
    const start = Temporal.Instant.fromEpochMilliseconds(Math.round(timestamp));
    const elapsed = start.until(now, {
      largestUnit: "hour",
      smallestUnit: "second",
      roundingMode: "floor"
    });
    return formatters().duration.digital.format(elapsed);
  } catch (e) {
    console.warn(e);
    return t("datetime.error");
  }
}

export function formatMillisElapsedDigital(milliseconds: number) {
  try {
    const duration = Temporal.Duration.from({
      milliseconds: Math.round(milliseconds)
    });
    const rounded = duration.round({
      largestUnit: "hour",
      smallestUnit: "second",
      roundingMode: "floor"
    });
    return formatters().duration.digitalShort.format(rounded);
  } catch (e) {
    console.warn(e);
    return t("datetime.error");
  }
}

/**
 * Formats a remaining duration with narrow units, rounding up.
 * This will return "0s" when the duration is empty.
 */
export function formatMillisRemainingNarrow(millis: number) {
  try {
    const duration = Temporal.Duration.from({
      milliseconds: Math.round(millis)
    });
    const rounded = roundDuration(duration, undefined, {
      roundingMode: "ceil",
      largestUnit: "hour"
    });
    const formatter = rounded.secondsOnly
      ? formatters().duration.narrowForceSeconds
      : formatters().duration.narrow;
    return formatter.format(rounded.duration);
  } catch (e) {
    console.warn(e);
    return t("datetime.error");
  }
}

export function calculateTimeElapsedForActivityStatus(
  startTime: number,
  music = false,
  speed = 1,
  updatedAt?: number
) {
  try {
    if (music) {
      return activityMusicTimeElapsed(startTime, speed, updatedAt);
    }
    return activityStatusDuration(startTime);
  } catch (e) {
    console.warn(e);
    return t("datetime.error");
  }
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
  const start = Temporal.Instant.fromEpochMilliseconds(
    Math.round(startTime)
  ).toZonedDateTimeISO(now.timeZoneId);
  let elapsed = start.until(now, {
    largestUnit: "years"
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
  mode?: RelativeMode
) {
  try {
    const now = Temporal.Now.zonedDateTimeISO();
    const start = Temporal.Instant.fromEpochMilliseconds(
      Math.round(timestamp)
    ).toZonedDateTimeISO(now.timeZoneId);
    let elapsed = start.until(now, {
      largestUnit: "years"
    });

    const inFuture = elapsed.sign == -1;
    if (inFuture) {
      elapsed = elapsed.negated();
    }
    const rounded = roundDuration(elapsed, inFuture ? now : start, {
      useWeeks: true
    });

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
  } catch (e) {
    console.warn(e);
    return t("datetime.error");
  }
}

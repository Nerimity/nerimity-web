import { useLocalStorage, StorageKeys } from "@/common/localStorage";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
dayjs.extend(duration);

export const [timeFormat, setTimeFormat] = useLocalStorage<"12hr" | "24hr">(
   StorageKeys.TIME_FORMAT,
  "24hr", 
  true    
);

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

export const fullDate = (
  timestamp: number,
  month: "short" | "long" = "short",
  weekday?: "long"
) => {
  return Intl.DateTimeFormat("en-GB", {
    weekday: weekday,
    day: "2-digit",
    month,
    year: "numeric",
  }).format(timestamp);
};

export function getDaysAgo(timestamp: number) {
  const rtf = new Intl.RelativeTimeFormat("en", {
    numeric: "auto",
  });
  const oneDayInMs = 1000 * 60 * 60 * 24;
  const daysDifference = Math.round((timestamp - Date.now()) / oneDayInMs);

  return rtf.format(daysDifference, "day");
}

export function timeSince(timestamp: number, showSeconds = false) {
  const now = new Date();
  const secondsPast = Math.abs((now.getTime() - timestamp) / 1000);

  if (secondsPast < 60) {
    if (showSeconds) {
      return pluralize(Math.trunc(secondsPast), "second", "ago");
    }
    return "few seconds ago";
  }

  const duration = dayjs.duration(Math.abs(timestamp - Date.now()));

  const hrs = duration.hours();
  const mins = duration.minutes();

  if (duration.asHours() >= 24) {
    return formatTimestamp(timestamp);
  }

  if (hrs) {
    return pluralize(hrs, "hour") + " ago";
  }
  if (mins) {
    return pluralize(mins, "minute") + " ago";
  }

  return formatTimestamp(timestamp);
}

export function timeElapsed(
  timestamp: number,
  onlyPadSeconds = false,
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

  seconds = Math.floor(seconds);

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds - hours * 3600) / 60);
  seconds -= hours * 3600 + minutes * 60;
  const formattedTime =
    (hours
      ? hours.toString().padStart(onlyPadSeconds ? 1 : 2, "0") + ":"
      : "") +
    minutes.toString().padStart(onlyPadSeconds ? 1 : 2, "0") +
    ":" +
    seconds.toString().padStart(2, "0");
  return formattedTime;
}
export function millisecondsToHhMmSs(
  timestamp: number,
  onlyPadSeconds = false
) {
  let seconds = Math.floor(timestamp / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds - hours * 3600) / 60);
  seconds -= hours * 3600 + minutes * 60;
  const formattedTime =
    (hours
      ? hours.toString().padStart(onlyPadSeconds ? 1 : 2, "0") + ":"
      : "") +
    minutes.toString().padStart(onlyPadSeconds ? 1 : 2, "0") +
    ":" +
    seconds.toString().padStart(2, "0");
  return formattedTime;
}

export function millisecondsToReadable(timestamp: number) {
  let seconds = Math.floor(timestamp / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds - hours * 3600) / 60);
  seconds -= hours * 3600 + minutes * 60;

  const text = [];

  if (hours) {
    text.push(`${hours}h`);
  }

  if (minutes) {
    text.push(`${minutes}m`);
  }

  if (seconds) {
    text.push(`${seconds}s`);
  }

  return text.join(" ");
}

export function calculateTimeElapsedForActivityStatus(
  startTime: number,
  music = false,
  speed = 1,
  updatedAt?: number
) {
  // Get the current time in milliseconds.
  const now = Date.now();
  // Calculate the time elapsed in milliseconds.
  const timeElapsedMS = now - startTime;
  // Convert the time elapsed from milliseconds to seconds.
  const timeElapsedInSeconds = timeElapsedMS / 1000;

  if (music) {
    return timeElapsed(startTime, true, speed, updatedAt);
  }

  // Return the time elapsed in seconds.
  return convertSecondsForActivityStatus(timeElapsedInSeconds);
}

function convertSecondsForActivityStatus(totalSecs: number) {
  const monthLength = 30;

  const totalMins = Math.floor(totalSecs / 60);
  const totalHours = Math.floor(totalMins / 60);
  const totalDays = Math.floor(totalHours / 24);

  const years = Math.floor(totalDays / 365);
  const yearRemaining = totalDays % 365;
  const months = Math.floor(yearRemaining / monthLength);
  const monthRemaining = yearRemaining % monthLength;
  const weeks = Math.floor(monthRemaining / 7);
  const days = monthRemaining % 7;

  const hours = totalHours % 24;
  const mins = totalMins % 60;
  const secs = Math.floor(totalSecs % 60);

  const values = [];

  if (totalSecs < 1) {
    values.push("0s");
  } else if (totalHours < 1) {
    if (mins) values.push(mins + "m");
    if (secs) values.push(secs + "s");
  } else if (totalDays < 1) {
    if (hours) values.push(hours + "h");
    if (mins) values.push(mins + "m");
  } else if (totalDays < 7) {
    if (days) values.push(days + "d");
    if (hours) values.push(hours + "h");
  } else if (totalDays < monthLength) {
    if (weeks) values.push(weeks + "w");
    if (days) values.push(days + "d");
  } else if (totalDays < 365) {
    if (months) values.push(months + "mo");
    if (weeks) values.push(weeks + "w");
    if (days && weeks === 0 && months < 2) {
      values.push(days + "d");
    }
  } else {
    if (years) values.push(years + "y");
    if (months) values.push(months + "mo");
  }

  return values.join(" ");
}

export function timeSinceMentions(timestamp: number) {
  const rawDuration = Date.now() - timestamp;
  const duration = Math.abs(rawDuration);

  const text = (...values: string[]) => {
    const value = values.filter(Boolean).join(" ");
    return rawDuration < 0 ? `In ${value}` : `${value} ago`;
  };

  const monthLength = 30;

  const totalSecs = Math.floor(duration / 1000);
  const totalMins = Math.floor(totalSecs / 60);
  const totalHours = Math.floor(totalMins / 60);
  const totalDays = Math.floor(totalHours / 24);

  const years = Math.floor(totalDays / 365);
  const yearRemaining = totalDays % 365;
  const months = Math.floor(yearRemaining / monthLength);
  const monthRemaining = yearRemaining % monthLength;
  const weeks = Math.floor(monthRemaining / 7);
  const days = monthRemaining % 7;

  const hours = totalHours % 24;
  const mins = totalMins % 60;
  const secs = totalSecs % 60;

  const values = [];

  if (totalSecs < 1) {
    values.push("0 seconds");
  } else if (totalHours < 1) {
    if (mins) values.push(pluralize(mins, "minute"));
    if (secs) values.push(pluralize(secs, "second"));
  } else if (totalDays < 1) {
    if (hours) values.push(pluralize(hours, "hour"));
    if (mins) values.push(pluralize(mins, "minute"));
  } else if (totalDays < 7) {
    if (days) values.push(pluralize(days, "day"));
    if (hours) values.push(pluralize(hours, "hour"));
  } else if (totalDays < monthLength) {
    if (weeks) values.push(pluralize(weeks, "week"));
    if (days) values.push(pluralize(days, "day"));
  } else if (totalDays < 365) {
    if (months) values.push(pluralize(months, "month"));
    if (weeks) values.push(pluralize(weeks, "week"));
    if (days && weeks === 0 && months < 2) {
      values.push(pluralize(days, "day"));
    }
  } else {
    if (years) values.push(pluralize(years, "year"));
    if (months) values.push(pluralize(months, "month"));
  }

  return text(values.join(" "));
}

function pluralize(
  count: number,
  word: string,
  suffix?: string,
  hideIfZero = false
) {
  if (hideIfZero && !count) return "";
  return (
    count + " " + (count > 1 ? `${word}s` : word + (suffix ? ` ${suffix}` : ""))
  );
}


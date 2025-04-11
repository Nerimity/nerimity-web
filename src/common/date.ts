import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
dayjs.extend(duration);

// Weeks are not working as intended. update package when this gets merged.
// https://github.com/iamkun/dayjs/pull/2811

// make a function where if the number is less than 10, it will add a 0 in front of it
function pad(num: number) {
  return num < 10 ? `0${num}` : num;
}

// convert timestamp to today at 13:00 or yesterday at 13:00 or date. add zero if single digit
export function formatTimestamp(timestamp: number) {
  const date = new Date(timestamp);
  const today = new Date();

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const sameYear = today.getFullYear() === date.getFullYear();

  if (
    sameYear &&
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth()
  ) {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  } else if (sameYear && yesterday.toDateString() === date.toDateString()) {
    return `Yesterday at ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  } else {
    return `${Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date)} at ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
}

export const fullDate = (timestamp: number, month: "short" | "long" = "short", weekday?: "long") => {
    return Intl.DateTimeFormat("en-GB", {
      weekday: weekday,
      day: "2-digit",
      month,
      year: "numeric",
    }).format(timestamp);
};

export const fullDateTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return `${fullDate(timestamp)} at ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// get days ago from timestamp
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
    return pluralize(hrs,  "hour") + " ago";
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

function convertSecondsForActivityStatus(totalSeconds: number) {
  const secondsToMs = totalSeconds * 1000;
  const duration = dayjs.duration(secondsToMs);

  const yrs = duration.years();
  const mnts = duration.months();
  const wks = duration.weeks();
  const days = duration.days();
  const hrs = duration.hours();
  const mins = duration.minutes();
  const secs = duration.seconds();


  const values = [];
  if (yrs) {
    values.push(yrs + "y");
  }
  if (mnts) {
    values.push(mnts +  "m");
  }
  if (wks) {
    values.push(wks +  "w");
  }
  if (days) {
    values.push(days +  "d");
  }
  if (hrs) {
    values.push(hrs +  "h");
  }
  if (mins) {
    values.push(mins +  "m");
  }
  if (secs) {
    values.push(secs +  "s");
  }

  return values.slice(0, 2).join(" ");





}


export function timeSinceMentions(timestamp: number) {

  const duration = dayjs.duration(Math.abs(Date.now() - timestamp));
  const now = new Date();

  const rawSecondsPast = (now.getTime() - timestamp) / 1000;

  const text = (...values: string[]) => {
    const value = values.filter(Boolean).join(" ");
    return rawSecondsPast < 0 ? `In ${value}` : `${value} ago`;
  };


  const yrs = duration.years();
  const mnts = duration.months();
  const wks = duration.weeks();
  const days = duration.days();
  const hrs = duration.hours();
  const mins = duration.minutes();
  const secs = duration.seconds();


  const values = [];
  if (yrs) {
    values.push(pluralize(yrs, "year"));
  }
  if (mnts) {
    values.push(pluralize(mnts, "month"));
  }
  if (wks) {
    values.push(pluralize(wks, "week"));
  }
  if (days) {
    values.push(pluralize(days, "day"));
  }
  if (hrs) {
    values.push(pluralize(hrs, "hour"));
  }
  if (mins) {
    values.push(pluralize(mins, "minute"));
  }
  if (secs) {
    values.push(pluralize(secs, "second"));
  }

  return text(values.slice(0, 2).join(" "));
  
}


function pluralize(count: number,word: string, suffix?: string, hideIfZero = false) {
  if (hideIfZero && !count) return "";
  return (count + " ") + (count > 1 ? `${word}s` : word + (suffix? ` ${suffix}` : ""));
}
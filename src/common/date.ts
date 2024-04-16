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

  if (date.getDate() === today.getDate() && date.getMonth() === today.getMonth()) {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
  else if (yesterday.toDateString() === date.toDateString()) {
    return `Yesterday at ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
  
  else {
    return `${Intl.DateTimeFormat("en-GB", {day: "2-digit", month: "short", year: "numeric"}).format(date)} at ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
}


// get days ago from timestamp
export function getDaysAgo(timestamp: number) {
  const rtf = new Intl.RelativeTimeFormat("en", {
    numeric: "auto"
  });
  const oneDayInMs = 1000 * 60 * 60 * 24;
  const daysDifference = Math.round(
    (timestamp - Date.now()) / oneDayInMs
  );

  return rtf.format(daysDifference, "day");
}

export function timeSince(timestamp: number, showSeconds = false) {
  const now = new Date();
  const secondsPast = Math.abs((now.getTime() - timestamp) / 1000);
  if (secondsPast < 60) {
    if (showSeconds) {
      return Math.round(secondsPast) + " seconds ago";
    }
    return "few seconds ago";
  }
  if (secondsPast < 3600) {
    return Math.round(secondsPast / 60) + " minutes ago";
  }
  if (secondsPast <= 86400) {
    return Math.round(secondsPast / 3600) + " hours ago";
  }
  return formatTimestamp(timestamp);
}

export function timeElapsed(timestamp: number, onlyPadSeconds = false) {
  let seconds = Math.floor((Date.now() - timestamp) / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds - (hours * 3600)) / 60);
  seconds -= hours * 3600 + minutes * 60;
  const formattedTime = (hours ? (hours.toString().padStart(onlyPadSeconds ? 1 : 2, "0") + ":") : "") +
    minutes.toString().padStart(onlyPadSeconds ? 1 : 2, "0") + ":" +
    seconds.toString().padStart(2, "0");
  return formattedTime;
}
export function millisecondsToHhMmSs(timestamp: number, onlyPadSeconds = false) {
  let seconds = Math.floor((timestamp) / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds - (hours * 3600)) / 60);
  seconds -= hours * 3600 + minutes * 60;
  const formattedTime = (hours ? (hours.toString().padStart(onlyPadSeconds ? 1 : 2, "0") + ":") : "") +
    minutes.toString().padStart(onlyPadSeconds ? 1 : 2, "0") + ":" +
    seconds.toString().padStart(2, "0");
  return formattedTime;
}




export function calculateTimeElapsedForActivityStatus(startTime: number, music = false) {
  // Get the current time in milliseconds.
  const now = Date.now();
  // Calculate the time elapsed in milliseconds.
  const timeElapsedMS = now - startTime;
  // Convert the time elapsed from milliseconds to seconds.
  const timeElapsedInSeconds = timeElapsedMS / 1000;

  if (music) {
    return timeElapsed(startTime, true);
  }

  // Return the time elapsed in seconds.
  return convertSecondsForActivityStatus(timeElapsedInSeconds);
}

function convertSecondsForActivityStatus(totalSeconds: number) {
  const days = Math.floor(totalSeconds / (24*60*60));
  totalSeconds %= 24*60*60;
  const hours = Math.floor(totalSeconds / (60*60));
  totalSeconds %= 60*60;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const roundedSeconds = Math.round(seconds);

  if (days) {
    return `${days}d ${hours}h`;
  }

  if (hours) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes) {
    return `${minutes} minute${minutes <= 1 ? "" : "s"}`;
  }
  return `${roundedSeconds} second${roundedSeconds <= 1 ? "" : "s"}`;
}

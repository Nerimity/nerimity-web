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
  } else if (yesterday.toDateString() === date.toDateString()) {
    return `Yesterday at ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  } else {
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} at ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
}


// get days ago from timestamp
export function getDaysAgo(timestamp: number) {
  const rtf = new Intl.RelativeTimeFormat('en', {
    numeric: 'auto',
  });
  const oneDayInMs = 1000 * 60 * 60 * 24;
  const daysDifference = Math.round(
    (timestamp - Date.now()) / oneDayInMs,
  );

  return rtf.format(daysDifference, 'day');
}

export function timeSince(timestamp: number) {
  let now = new Date();
  let secondsPast = (now.getTime() - timestamp) / 1000;
  if (secondsPast < 60) {
    return 'few seconds ago';
  }
  if (secondsPast < 3600) {
    return Math.round(secondsPast / 60) + ' minutes ago';
  }
  if (secondsPast <= 86400) {
    return Math.round(secondsPast / 3600) + ' hours ago';
  }
  return formatTimestamp(timestamp)
}

export function timeElapsed(timestamp: number) {
  let seconds = Math.floor((Date.now() - timestamp) / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds - (hours * 3600)) / 60);
  seconds -= hours * 3600 + minutes * 60;
  const formattedTime = (hours ? (hours.toString().padStart(2, '0') + ':') : '') +
    minutes.toString().padStart(2, '0') + ':' +
    seconds.toString().padStart(2, '0');
    return formattedTime;
}
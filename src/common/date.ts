// make a function where if the number is less than 10, it will add a 0 in front of it
function pad(num: number) {
  return num < 10 ? `0${num}` : num;
}

// convert timestamp to today at 13:00 or yesterday at 13:00 or date. add zero if single digit
export function formatTimestamp(timestamp: number | string) {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86400000);
  if (date.getDate() === today.getDate() && date.getMonth() === today.getMonth()) {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  } else if (date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth()) {
    return `Yesterday at ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  } else {
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} at ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
}


// get days ago from timestamp
export function getDaysAgo(timestamp: number | string) {
  const date = new Date(timestamp);
  const rtf = new Intl.RelativeTimeFormat('en', {
    numeric: 'auto',
  });
  const oneDayInMs = 1000 * 60 * 60 * 24;
  const daysDifference = Math.round(
    (date.getTime() - new Date().getTime()) / oneDayInMs,
  );

  return rtf.format(daysDifference, 'day');
}
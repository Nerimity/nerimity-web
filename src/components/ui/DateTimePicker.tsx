import style from "./DateTimePicker.module.css";
import DropDown from "./drop-down/DropDown";
import Icon from "./icon/Icon";
import Input from "./input/Input";
import { createEffect, createMemo, createSignal, Show } from "solid-js";

const MonthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "June",
  "July",
  "Aug",
  "Sept",
  "Oct",
  "Nov",
  "Dec",
];

const hours = Array.from({ length: 24 }, (_, index) => index);
const minutes = Array.from({ length: 60 }, (_, index) => index);

export const DateTimePicker = (props: {
  value: Date;
  onChange: (date: Date) => void;
}) => {
  const [selectedDay, setSelectedDay] = createSignal(props.value.getDate());
  const [selectedMonth, setSelectedMonth] = createSignal(
    props.value.getMonth()
  );
  const [selectedYear, setSelectedYear] = createSignal(
    props.value.getFullYear()
  );
  const [selectedHour, setSelectedHour] = createSignal(props.value.getHours());
  const [selectedMinute, setSelectedMinute] = createSignal(
    props.value.getMinutes()
  );

  const dayNamesInMonth = () => {
    const totalDays = getDaysInMonth(selectedYear(), selectedMonth());

    return Array.from({ length: totalDays }, (_, index) => ({
      day: index + 1,
      dayName: getShortDayNameForDate(
        selectedYear(),
        selectedMonth(),
        index + 1
      ),
    }));
  };

  createEffect(() => {
    if (selectedDay() > getDaysInMonth(selectedYear(), selectedMonth())) {
      setSelectedDay(getDaysInMonth(selectedYear(), selectedMonth()));
    }
  });

  createEffect(() => {
    const date = new Date(
      selectedYear(),
      selectedMonth(),
      selectedDay(),
      selectedHour(),
      selectedMinute()
    );
    props.onChange(date);
  });

  return (
    <div class={style.container}>
      <div class={style.dayAndMonthContainer}>
        {/* Year */}
        <Input
          type="number"
          class={style.yearInput}
          value={selectedYear().toString()}
          onText={(value) => setSelectedYear(parseInt(value))}
        />
        {/* month */}
        <DropDown
          selectedId={selectedMonth().toString()}
          onChange={(item) => setSelectedMonth(parseInt(item.id))}
          items={MonthNames.map((month, index) => ({
            id: index.toString(),
            label: `${month}`,
          }))}
        />
        {/* day */}
        <DropDown
          onChange={(item) => setSelectedDay(parseInt(item.id))}
          selectedId={selectedDay().toString()}
          items={dayNamesInMonth().map((day) => ({
            id: day.day.toString(),
            label: `${addOrdinalSuffix(day.day)} ${day.dayName} `,
          }))}
        />
      </div>

      <div class={style.timeContainer}>
        <DropDown
          onChange={(item) => setSelectedHour(parseInt(item.id))}
          selectedId={selectedHour().toString()}
          items={hours.map((hour) => ({
            id: hour.toString(),
            label: `${hour.toString().padStart(2, "0")}`,
          }))}
        />
        <DropDown
          onChange={(item) => setSelectedMinute(parseInt(item.id))}
          selectedId={selectedMinute().toString()}
          items={minutes.map((minute) => ({
            id: minute.toString(),
            label: `${minute.toString().padStart(2, "0")}`,
          }))}
        />
      </div>
    </div>
  );
};

/**
 * Gets the short day name (e.g., "Mon", "Tue") for a given date.
 *
 * @param {number} year The full year (e.g., 2025).
 * @param {number} month The month (0-indexed: 0 for January, 11 for December).
 * @param {number} day The day of the month (1-31).
 * @param {string} [locale='en-US'] The BCP 47 language tag (e.g., 'en-US', 'en-GB', 'es-ES').
 * Defaults to 'en-US'.
 * @returns {string} The short day name.
 */
function getShortDayNameForDate(
  year: number,
  month: number, // 0-indexed month
  day: number,
  locale: string = "en-US"
): string {
  // Create a Date object from the provided year, month, and day.
  // JavaScript's Date constructor handles valid ranges (e.g., day 0 means last day of prev month)
  // and will automatically roll over if an invalid day/month is provided (e.g., Feb 30th).
  const date = new Date(year, month, day);

  // Optional: Basic validation to warn if the date inputs resulted in a "rolled-over" date.
  // This checks if the constructed date's year, month, and day still match the inputs.
  // This is a simple check; for robust date validation, consider a dedicated library.
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    console.warn(
      `Warning: Input date ${year}-${
        month + 1
      }-${day} resulted in a different date object: ${date.toDateString()}. Check your inputs.`
    );
    // Depending on your requirements, you might throw an error here,
    // or simply return the day name for the "adjusted" date.
    // For this example, we'll proceed with the adjusted date.
  }

  // Use toLocaleDateString to get the formatted day name.
  // The `weekday: 'short'` option ensures we get the abbreviated form.
  return date.toLocaleDateString(locale, { weekday: "short" });
}

function getDaysInMonth(year, month) {
  // Month is 0-indexed in JavaScript (0 for January, 11 for December)
  // So, to get the last day of the 'month' passed in, we create a date
  // for the 0th day of the 'month + 1'.
  // The 0th day of a month is the last day of the *previous* month.
  return new Date(year, month + 1, 0).getDate();
}

function addOrdinalSuffix(n: number): string {
  // Ensure the input is a valid number
  // In TypeScript, 'n: number' already ensures 'n' is a number at compile time.
  // The runtime check 'typeof n !== 'number' ' is technically redundant if you trust your TypeScript compilation.
  // However, '!Number.isInteger(n)' is still a valuable runtime check for integer validity.
  if (!Number.isInteger(n)) {
    throw new Error("Input must be an integer.");
  }

  // Handle numbers ending in 11, 12, or 13, which all take 'th'
  // regardless of their last digit.
  const lastTwoDigits: number = n % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return n + "th";
  }

  // For all other numbers, determine the suffix based on the last digit
  const lastDigit: number = n % 10;
  switch (lastDigit) {
    case 1:
      return n + "st";
    case 2:
      return n + "nd";
    case 3:
      return n + "rd";
    default:
      return n + "th";
  }
}

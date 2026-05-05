import Button from "./Button";
import style from "./DateTimePicker.module.css";
import DropDown from "./drop-down/DropDown";
import Input from "./input/Input";
import { createEffect, createSignal, For, untrack } from "solid-js";

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
  "Dec"
];

const Presets = [
  {
    label: "15m",
    value: 15 * 60
  },
  {
    label: "30m",
    value: 30 * 60
  },
  {
    label: "1h",
    value: 60 * 60
  },
  {
    label: "6h",
    value: 6 * 60 * 60
  },
  {
    label: "12h",
    value: 12 * 60 * 60
  },
  {
    label: "1d",
    value: 24 * 60 * 60
  }
];

const hours = Array.from({ length: 24 }, (_, index) => index);
const minutes = Array.from({ length: 60 }, (_, index) => index);

export const DateTimePicker = (props: {
  value: Date;
  onChange: (date: Date) => void;
}) => {
  const [selectedDay, setSelectedDay] = createSignal(
    untrack(() => props.value.getDate())
  );
  const [selectedMonth, setSelectedMonth] = createSignal(
    untrack(() => props.value.getMonth())
  );
  const [selectedYear, setSelectedYear] = createSignal(
    untrack(() => props.value.getFullYear())
  );
  const [selectedHour, setSelectedHour] = createSignal(
    untrack(() => props.value.getHours())
  );
  const [selectedMinute, setSelectedMinute] = createSignal(
    untrack(() => props.value.getMinutes())
  );

  const dayNamesInMonth = () => {
    const year = selectedYear();
    const month = selectedMonth();
    const totalDays = getDaysInMonth(year, month);

    return Array.from({ length: totalDays }, (_, index) => {
      return {
        day: index + 1,
        dayName: getShortDayNameForDate(year, month, index + 1)
      };
    });
  };

  createEffect(() => {
    if (selectedDay() > getDaysInMonth(selectedYear(), selectedMonth())) {
      setSelectedDay(getDaysInMonth(selectedYear(), selectedMonth()));
    }
  });

  const date = () => {
    return new Date(
      selectedYear(),
      selectedMonth(),
      selectedDay(),
      selectedHour(),
      selectedMinute()
    );
  };

  createEffect(() => {
    props.onChange(date());
  });

  return (
    <div class={style.container}>
      <span class={style.presetsLabel}>Presets</span>
      <div class={style.presets}>
        <For each={Presets}>
          {(preset) => (
            <Button
              margin={0}
              padding={8}
              class={style.presetButton}
              primary={
                Math.abs(
                  props.value.getTime() - (Date.now() + preset.value * 1000)
                ) < 60_000
              }
              onClick={() => {
                const date = new Date(Date.now() + preset.value * 1000);
                setSelectedDay(date.getDate());
                setSelectedMonth(date.getMonth());
                setSelectedYear(date.getFullYear());
                setSelectedHour(date.getHours());
                setSelectedMinute(date.getMinutes());
                props.onChange(date);
              }}
              label={preset.label}
            />
          )}
        </For>
      </div>
      <div class={style.dayAndMonthContainer}>
        {/* Presets */}
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
            label: `${month}`
          }))}
        />
        {/* day */}
        <DropDown
          onChange={(item) => setSelectedDay(parseInt(item.id))}
          selectedId={selectedDay().toString()}
          items={dayNamesInMonth().map((day) => ({
            id: day.day.toString(),
            label: `${addOrdinalSuffix(day.day)} ${day.dayName} `
          }))}
        />
      </div>

      <div class={style.timeContainer}>
        <DropDown
          onChange={(item) => setSelectedHour(parseInt(item.id))}
          selectedId={selectedHour().toString()}
          items={hours.map((hour) => ({
            id: hour.toString(),
            label: `${hour.toString().padStart(2, "0")}`
          }))}
        />
        <DropDown
          onChange={(item) => setSelectedMinute(parseInt(item.id))}
          selectedId={selectedMinute().toString()}
          items={minutes.map((minute) => ({
            id: minute.toString(),
            label: `${minute.toString().padStart(2, "0")}`
          }))}
        />
      </div>
    </div>
  );
};

function getShortDayNameForDate(
  year: number,
  month: number, // 0-indexed month
  day: number,
  locale: string = "en-US"
): string {
  const date = new Date(year, month, day);

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
  }

  return date.toLocaleDateString(locale, { weekday: "short" });
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function addOrdinalSuffix(n: number): string {
  if (!Number.isInteger(n)) {
    throw new Error("Input must be an integer.");
  }

  const lastTwoDigits: number = n % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return n + "th";
  }

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

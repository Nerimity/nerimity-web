import style from "./Timestamps.module.css";
import {
  calculateTimeElapsedForActivityStatus,
  formatMillisElapsedDigital,
  formatMillisRemainingNarrow,
  formatTimestampRelative,
  timeSince,
  timeSinceDigital
} from "@/common/date";

export default function Timestamps() {
  return (
    <div class={style.container}>
      <table class={style.table}>
        <thead>
          <tr>
            <th>desc</th>
            <th>timeSince</th>
            <th>timeSince(alt)</th>
            <th>timeSinceDigital</th>
            <th>ElapsedDigital</th>
            <th>RemainingNarrow</th>
            <th>ActivityStatus</th>
            <th>TimestampRelative</th>
          </tr>
        </thead>
        <tbody class={style.section}>
          <TimeTableRow label="undef" timestamp={(_t) => undefined as any} />
          <TimeTableRow label="null" timestamp={(_t) => null as any} />
          <TimeTableRow label="NaN" timestamp={(_t) => NaN} />
        </tbody>
        <tbody class={style.section}>
          <TimeTableRow
            label="in 61m 31s"
            timestamp={(t) => t + (61 * 60 * 1000 + 31 * 1000)}
          />
          <TimeTableRow
            label="in 61m 30s"
            timestamp={(t) => t + (61 * 60 * 1000 + 30 * 1000)}
          />
          <TimeTableRow
            label="in 61m 1s"
            timestamp={(t) => t + (61 * 60 * 1000 + 1000)}
          />
          <TimeTableRow label="in 61m" timestamp={(t) => t + 61 * 60 * 1000} />
          <TimeTableRow
            label="in 60m 30s"
            timestamp={(t) => t + (60 * 60 * 1000 + 30 * 1000)}
          />
          <TimeTableRow
            label="in 60m 1s"
            timestamp={(t) => t + (60 * 60 * 1000 + 1000)}
          />
          <TimeTableRow label="in 60m" timestamp={(t) => t + 60 * 60 * 1000} />
          <TimeTableRow
            label="in 59m 59.5s"
            timestamp={(t) => t + (59 * 60 * 1000 + 59 * 1000 + 500)}
          />
          <TimeTableRow
            label="in 59m 59s"
            timestamp={(t) => t + (59 * 60 * 1000 + 59 * 1000)}
          />
          <TimeTableRow
            label="in 59m 30s"
            timestamp={(t) => t + (59 * 60 * 1000 + 30 * 1000)}
          />
          <TimeTableRow label="in 59m" timestamp={(t) => t + 59 * 60 * 1000} />
          <TimeTableRow
            label="in 10m 30s"
            timestamp={(t) => t + (10 * 60 * 1000 + 30 * 1000)}
          />
          <TimeTableRow
            label="in 10m 1s"
            timestamp={(t) => t + (10 * 60 * 1000 + 1000)}
          />
          <TimeTableRow
            label="in 10m 0.5s"
            timestamp={(t) => t + (10 * 60 * 1000 + 500)}
          />
          <TimeTableRow label="in 10m" timestamp={(t) => t + 10 * 60 * 1000} />
          <TimeTableRow
            label="in 9m 59s"
            timestamp={(t) => t + (9 * 60 + 59) * 1000}
          />
          <TimeTableRow label="in 9m" timestamp={(t) => t + 9 * 60 * 1000} />
          <TimeTableRow label="in 1m 30s" timestamp={(t) => t + 90 * 1000} />
          <TimeTableRow label="in 1m 1s" timestamp={(t) => t + 61 * 1000} />
          <TimeTableRow
            label="in 1m 0.5s"
            timestamp={(t) => t + (60 * 1000 + 500)}
          />
          <TimeTableRow label="in 1m" timestamp={(t) => t + 60 * 1000} />
          <TimeTableRow label="in 59.5s" timestamp={(t) => t + 59.5 * 1000} />
          <TimeTableRow label="in 59s" timestamp={(t) => t + 59 * 1000} />
          <TimeTableRow label="in 30s" timestamp={(t) => t + 30 * 1000} />
          <TimeTableRow label="in 5s" timestamp={(t) => t + 5000} />
          <TimeTableRow label="in 1s" timestamp={(t) => t + 1000} />
          <TimeTableRow label="in 0.5s" timestamp={(t) => t + 500} />
        </tbody>
        <tbody class={style.section}>
          <TimeTableRow label="now" timestamp={(t) => t} />
          <TimeTableRow label="0.5s ago" timestamp={(t) => t - 500} />
          <TimeTableRow label="1s ago" timestamp={(t) => t - 1000} />
          <TimeTableRow label="5s ago" timestamp={(t) => t - 5000} />
          <TimeTableRow label="30s ago" timestamp={(t) => t - 30 * 1000} />
          <TimeTableRow label="59s ago" timestamp={(t) => t - 59 * 1000} />
          <TimeTableRow label="59.5s ago" timestamp={(t) => t - 59.5 * 1000} />
          <TimeTableRow label="1m ago" timestamp={(t) => t - 60 * 1000} />
          <TimeTableRow
            label="1m 0.5s ago"
            timestamp={(t) => t - (60 * 1000 + 500)}
          />
          <TimeTableRow label="1m 1s ago" timestamp={(t) => t - 61 * 1000} />
          <TimeTableRow label="1m 30s ago" timestamp={(t) => t - 90 * 1000} />
          <TimeTableRow label="9m ago" timestamp={(t) => t - 9 * 60 * 1000} />
          <TimeTableRow
            label="9m 59s ago"
            timestamp={(t) => t - (9 * 60 + 59) * 1000}
          />
          <TimeTableRow label="10m ago" timestamp={(t) => t - 10 * 60 * 1000} />
          <TimeTableRow
            label="10m 0.5s ago"
            timestamp={(t) => t - (10 * 60 * 1000 + 500)}
          />
          <TimeTableRow
            label="10m 1s ago"
            timestamp={(t) => t - (10 * 60 * 1000 + 1000)}
          />
          <TimeTableRow
            label="10m 30s ago"
            timestamp={(t) => t - (10 * 60 * 1000 + 30 * 1000)}
          />
          <TimeTableRow label="59m ago" timestamp={(t) => t - 59 * 60 * 1000} />
          <TimeTableRow
            label="59m 30s ago"
            timestamp={(t) => t - (59 * 60 * 1000 + 30 * 1000)}
          />
          <TimeTableRow
            label="59m 59s ago"
            timestamp={(t) => t - (59 * 60 * 1000 + 59 * 1000)}
          />
          <TimeTableRow
            label="59m 59.5s ago"
            timestamp={(t) => t - (59 * 60 * 1000 + 59 * 1000 + 500)}
          />
          <TimeTableRow label="60m ago" timestamp={(t) => t - 60 * 60 * 1000} />
          <TimeTableRow
            label="60m 1s ago"
            timestamp={(t) => t - (60 * 60 * 1000 + 1000)}
          />
          <TimeTableRow
            label="60m 30s ago"
            timestamp={(t) => t - (60 * 60 * 1000 + 30 * 1000)}
          />
          <TimeTableRow label="61m ago" timestamp={(t) => t - 61 * 60 * 1000} />
          <TimeTableRow
            label="61m 1s ago"
            timestamp={(t) => t - (61 * 60 * 1000 + 1000)}
          />
          <TimeTableRow
            label="61m 30s ago"
            timestamp={(t) => t - (61 * 60 * 1000 + 30 * 1000)}
          />
          <TimeTableRow
            label="61m 31s ago"
            timestamp={(t) => t - (61 * 60 * 1000 + 31 * 1000)}
          />
        </tbody>
        <tbody class={style.section}>
          <TimeTableRow
            label="12h ago"
            timestamp={(t) => t - 12 * 60 * 60 * 1000}
          />
          <TimeTableRow
            label="12h 30m ago"
            timestamp={(t) => t - 12 * 60 * 60 * 1000 - 30 * 60 * 1000}
          />
          <TimeTableRow
            label="23h 30m ago"
            timestamp={(t) => t - 23 * 60 * 60 * 1000 - 30 * 60 * 1000}
          />
          <TimeTableRow
            label="23h 59m ago"
            timestamp={(t) => t - 23 * 60 * 60 * 1000 - 59 * 60 * 1000}
          />
          <TimeTableRow
            label="23h 59m 30s ago"
            timestamp={(t) =>
              t - 23 * 60 * 60 * 1000 - 59 * 60 * 1000 - 30 * 1000
            }
          />
          <TimeTableRow
            label="23h 59m 59s ago"
            timestamp={(t) =>
              t - 23 * 60 * 60 * 1000 - 59 * 60 * 1000 - 59 * 1000
            }
          />
          <TimeTableRow
            label="23h 59m 59.5s ago"
            timestamp={(t) =>
              t - 23 * 60 * 60 * 1000 - 59 * 60 * 1000 - 59 * 1000 - 500
            }
          />
          <TimeTableRow
            label="24h ago"
            timestamp={(t) => t - 24 * 60 * 60 * 1000}
          />
          <TimeTableRow
            label="36h ago"
            timestamp={(t) => t - 36 * 60 * 60 * 1000}
          />
          <TimeTableRow
            label="47h ago"
            timestamp={(t) => t - 47 * 60 * 60 * 1000}
          />
          <TimeTableRow
            label="7d - 1h ago"
            timestamp={(t) => t - (7 * 24 * 60 * 60 * 1000 - 60 * 60 * 1000)}
          />
          <TimeTableRow
            label="7d ago"
            timestamp={(t) => t - 7 * 24 * 60 * 60 * 1000}
          />
          <TimeTableRow
            label="9d ago"
            timestamp={(t) => t - 9 * 24 * 60 * 60 * 1000}
          />
          <TimeTableRow
            label="17d ago"
            timestamp={(t) => t - 17 * 24 * 60 * 60 * 1000}
          />
          <TimeTableRow
            label="27d ago"
            timestamp={(t) => t - 27 * 24 * 60 * 60 * 1000}
          />
          <TimeTableRow
            label="28d ago"
            timestamp={(t) => t - 28 * 24 * 60 * 60 * 1000}
          />
          <TimeTableRow
            label="30d ago"
            timestamp={(t) => t - 30 * 24 * 60 * 60 * 1000}
          />
          <TimeTableRow
            label="31d ago"
            timestamp={(t) => t - 31 * 24 * 60 * 60 * 1000}
          />
          <TimeTableRow
            label="32d ago"
            timestamp={(t) => t - 32 * 24 * 60 * 60 * 1000}
          />
          <TimeTableRow
            label="38d ago"
            timestamp={(t) => t - 38 * 24 * 60 * 60 * 1000}
          />
          <TimeTableRow
            label="65d ago"
            timestamp={(t) => t - 65 * 24 * 60 * 60 * 1000}
          />
          <TimeTableRow
            label="360d ago"
            timestamp={(t) => t - 360 * 24 * 60 * 60 * 1000}
          />
          <TimeTableRow
            label="364d ago"
            timestamp={(t) => t - 364 * 24 * 60 * 60 * 1000}
          />
          <TimeTableRow
            label="365d ago"
            timestamp={(t) => t - 365 * 24 * 60 * 60 * 1000}
          />
          <TimeTableRow
            label="366d ago"
            timestamp={(t) => t - 366 * 24 * 60 * 60 * 1000}
          />
        </tbody>
        <tbody class={style.section}>
          <TimeTableRow
            label="in 12h"
            timestamp={(t) => t + 12 * 60 * 60 * 1000}
          />
          <TimeTableRow
            label="in 12h 30m"
            timestamp={(t) => t + (12 * 60 * 60 * 1000 + 30 * 60 * 1000)}
          />
          <TimeTableRow
            label="in 23h 30m"
            timestamp={(t) => t + (23 * 60 * 60 * 1000 + 30 * 60 * 1000)}
          />
          <TimeTableRow
            label="in 23h 59m"
            timestamp={(t) => t + (23 * 60 * 60 * 1000 + 59 * 60 * 1000)}
          />
          <TimeTableRow
            label="in 23h 59m 30s"
            timestamp={(t) =>
              t + (23 * 60 * 60 * 1000 + 59 * 60 * 1000 + 30 * 1000)
            }
          />
          <TimeTableRow
            label="in 23h 59m 59s"
            timestamp={(t) =>
              t + (23 * 60 * 60 * 1000 + 59 * 60 * 1000 + 59 * 1000)
            }
          />
          <TimeTableRow
            label="in 23h 59m 59.5s"
            timestamp={(t) =>
              t + (23 * 60 * 60 * 1000 + 59 * 60 * 1000 + 59 * 1000 + 500)
            }
          />
          <TimeTableRow
            label="in 24h"
            timestamp={(t) => t + 24 * 60 * 60 * 1000}
          />
          <TimeTableRow
            label="in 36h"
            timestamp={(t) => t + 36 * 60 * 60 * 1000}
          />
          <TimeTableRow
            label="in 47h"
            timestamp={(t) => t + 47 * 60 * 60 * 1000}
          />
          <TimeTableRow
            label="in 7d - 1h"
            timestamp={(t) => t + (7 * 24 * 60 * 60 * 1000 - 60 * 60 * 1000)}
          />
          <TimeTableRow
            label="in 7d"
            timestamp={(t) => t + 7 * 24 * 60 * 60 * 1000}
          />
          <TimeTableRow
            label="in 9d"
            timestamp={(t) => t + 9 * 24 * 60 * 60 * 1000}
          />
          <TimeTableRow
            label="in 17d"
            timestamp={(t) => t + 17 * 24 * 60 * 60 * 1000}
          />
          <TimeTableRow
            label="in 27d"
            timestamp={(t) => t + 27 * 24 * 60 * 60 * 1000}
          />
          <TimeTableRow
            label="in 28d"
            timestamp={(t) => t + 28 * 24 * 60 * 60 * 1000}
          />
          <TimeTableRow
            label="in 30d"
            timestamp={(t) => t + 30 * 24 * 60 * 60 * 1000}
          />
          <TimeTableRow
            label="in 31d"
            timestamp={(t) => t + 31 * 24 * 60 * 60 * 1000}
          />
          <TimeTableRow
            label="in 32d"
            timestamp={(t) => t + 32 * 24 * 60 * 60 * 1000}
          />
          <TimeTableRow
            label="in 38d"
            timestamp={(t) => t + 38 * 24 * 60 * 60 * 1000}
          />
          <TimeTableRow
            label="in 65d"
            timestamp={(t) => t + 65 * 24 * 60 * 60 * 1000}
          />
          <TimeTableRow
            label="in 360d"
            timestamp={(t) => t + 360 * 24 * 60 * 60 * 1000}
          />
          <TimeTableRow
            label="in 364d"
            timestamp={(t) => t + 364 * 24 * 60 * 60 * 1000}
          />
          <TimeTableRow
            label="in 365d"
            timestamp={(t) => t + 365 * 24 * 60 * 60 * 1000}
          />
          <TimeTableRow
            label="in 366d"
            timestamp={(t) => t + 366 * 24 * 60 * 60 * 1000}
          />
        </tbody>
      </table>
    </div>
  );
}

function catchErrors(f: () => string) {
  try {
    return f();
  } catch {
    return "ERROR";
  }
}

function TimeTableRow(props: {
  label: string;
  timestamp: (t: number) => number;
}) {
  const now = +new Date();
  const timestamp = props.timestamp(now);
  return (
    <tr>
      <td class={style.label}>{props.label}</td>
      <td>{catchErrors(() => timeSince(timestamp))}</td>
      <td>{catchErrors(() => timeSince(timestamp, false))}</td>
      <td>{catchErrors(() => timeSinceDigital(timestamp))}</td>
      <td>{catchErrors(() => formatMillisElapsedDigital(now - timestamp))}</td>
      <td>{catchErrors(() => formatMillisRemainingNarrow(now - timestamp))}</td>
      <td>
        {catchErrors(() => calculateTimeElapsedForActivityStatus(timestamp))}
      </td>
      <td>{catchErrors(() => formatTimestampRelative(timestamp))}</td>
      {/* <td>{formatTimestamp(timestamp)}</td> */}
      {/* <td>{fullDate(props.timestamp)}</td> */}
    </tr>
  );
}

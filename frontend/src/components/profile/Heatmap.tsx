import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';

interface HeatmapData {
  date: string;
  totalSeconds: number;
}

interface HeatmapProps {
  data: HeatmapData[];
  year: number;
  onDayClick?: (date: string) => void;
}

export const Heatmap = ({ data, year, onDayClick }: HeatmapProps) => {
  // Convert data to format required by react-calendar-heatmap
  const values = data.map((item) => ({
    date: item.date,
    count: Math.floor(item.totalSeconds / 60), // Convert to minutes
  }));

  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);

  // Calculate max minutes for color scale
  const maxMinutes = Math.max(...values.map((v) => v.count), 1);

  const getColorClass = (value: any) => {
    if (!value || value.count === 0) {
      return 'color-empty';
    }
    const percentage = value.count / maxMinutes;
    if (percentage >= 0.75) return 'color-scale-4';
    if (percentage >= 0.5) return 'color-scale-3';
    if (percentage >= 0.25) return 'color-scale-2';
    return 'color-scale-1';
  };

  return (
    <div className="heatmap-container min-w-0 max-w-full overflow-x-auto">
      <style>{`
        .heatmap-container {
          background: var(--lt-surface);
          padding: 1rem;
          border: 1px solid var(--lt-border);
          border-radius: 0.75rem;
        }
        .react-calendar-heatmap {
          min-width: 680px;
          display: block;
          max-width: none;
          color: var(--lt-muted);
          font-size: 11px;
        }
        .react-calendar-heatmap .color-empty {
          fill: var(--lt-surface-highest);
        }
        .react-calendar-heatmap .color-scale-1 {
          fill: #315f55;
        }
        .react-calendar-heatmap .color-scale-2 {
          fill: #27826a;
        }
        .react-calendar-heatmap .color-scale-3 {
          fill: #32b982;
        }
        .react-calendar-heatmap .color-scale-4 {
          fill: var(--lt-green);
        }
        .react-calendar-heatmap text {
          font-size: 10px;
          fill: var(--lt-muted);
        }
        .react-calendar-heatmap rect:hover {
          stroke: var(--lt-primary);
          stroke-width: 1px;
        }
        .react-calendar-heatmap rect {
          cursor: ${onDayClick ? 'pointer' : 'default'};
        }
        .react-calendar-heatmap .month-label,
        .react-calendar-heatmap .wday {
          fill: var(--lt-muted);
        }
      `}</style>

      <CalendarHeatmap
        startDate={startDate}
        endDate={endDate}
        values={values}
        classForValue={getColorClass}
        showWeekdayLabels={true}
        onClick={(value) => value && onDayClick?.(value.date)}
      />

      <div className="mt-4 flex items-center justify-end gap-2 text-sm text-[var(--lt-muted)]">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="h-3 w-3 rounded-sm bg-[var(--lt-surface-highest)]"></div>
          <div
            className="h-3 w-3 rounded-sm"
            style={{ background: '#315f55' }}
          ></div>
          <div
            className="h-3 w-3 rounded-sm"
            style={{ background: '#27826a' }}
          ></div>
          <div
            className="h-3 w-3 rounded-sm"
            style={{ background: '#32b982' }}
          ></div>
          <div
            className="h-3 w-3 rounded-sm"
            style={{ background: 'var(--lt-green)' }}
          ></div>
        </div>
        <span>More</span>
      </div>
    </div>
  );
};

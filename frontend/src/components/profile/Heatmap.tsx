import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";

interface HeatmapData {
  date: string;
  totalSeconds: number;
}

interface HeatmapProps {
  data: HeatmapData[];
  year: number;
}

export const Heatmap = ({ data, year }: HeatmapProps) => {
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
      return "color-empty";
    }
    const percentage = value.count / maxMinutes;
    if (percentage >= 0.75) return "color-scale-4";
    if (percentage >= 0.5) return "color-scale-3";
    if (percentage >= 0.25) return "color-scale-2";
    return "color-scale-1";
  };

  return (
    <div className="heatmap-container">
      <style>{`
        .heatmap-container {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .react-calendar-heatmap {
          font-size: 12px;
        }
        .react-calendar-heatmap .color-empty {
          fill: #ebedf0;
        }
        .react-calendar-heatmap .color-scale-1 {
          fill: #9be9a8;
        }
        .react-calendar-heatmap .color-scale-2 {
          fill: #40c463;
        }
        .react-calendar-heatmap .color-scale-3 {
          fill: #30a14e;
        }
        .react-calendar-heatmap .color-scale-4 {
          fill: #216e39;
        }
        .react-calendar-heatmap text {
          font-size: 10px;
          fill: #767676;
        }
        .react-calendar-heatmap rect:hover {
          stroke: #555;
          stroke-width: 1px;
        }
      `}</style>

      <CalendarHeatmap
        startDate={startDate}
        endDate={endDate}
        values={values}
        classForValue={getColorClass}
        showWeekdayLabels={true}
      />

      <div className="mt-4 flex items-center justify-end gap-2 text-sm text-gray-600">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-gray-200"></div>
          <div
            className="w-3 h-3 rounded-sm"
            style={{ background: "#9be9a8" }}
          ></div>
          <div
            className="w-3 h-3 rounded-sm"
            style={{ background: "#40c463" }}
          ></div>
          <div
            className="w-3 h-3 rounded-sm"
            style={{ background: "#30a14e" }}
          ></div>
          <div
            className="w-3 h-3 rounded-sm"
            style={{ background: "#216e39" }}
          ></div>
        </div>
        <span>More</span>
      </div>
    </div>
  );
};

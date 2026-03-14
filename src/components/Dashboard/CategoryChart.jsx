/**
 * Monthly Expiry Trends Bar Chart
 */

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export default function CategoryChart({ monthlyTrends = [] }) {
  const labels = monthlyTrends.map(
    (t) => `${MONTH_NAMES[t._id.month - 1]} ${t._id.year}`
  );
  const values = monthlyTrends.map((t) => t.count);

  const data = {
    labels,
    datasets: [
      {
        label: "Products Expiring",
        data: values,
        backgroundColor: "rgba(245, 158, 11, 0.6)",
        borderColor: "rgba(245, 158, 11, 1)",
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1a1a24",
        borderColor: "#3d3d52",
        borderWidth: 1,
        titleColor: "#e5e7eb",
        bodyColor: "#9ca3af",
        padding: 12,
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(61,61,82,0.5)", drawBorder: false },
        ticks: { color: "#6b7280", font: { family: "'DM Sans'", size: 11 } },
      },
      y: {
        grid: { color: "rgba(61,61,82,0.5)", drawBorder: false },
        ticks: {
          color: "#6b7280",
          font: { family: "'DM Sans'", size: 11 },
          stepSize: 1,
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="card p-5">
      <h3 className="font-display font-semibold text-white mb-4">
        Monthly Expiry Forecast
      </h3>
      <div style={{ height: "220px" }}>
        {values.length > 0 ? (
          <Bar data={data} options={options} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 text-sm">
            No expiry data for the next 6 months
          </div>
        )}
      </div>
    </div>
  );
}
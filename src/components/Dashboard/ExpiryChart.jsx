/**
 * Expiry Distribution Doughnut Chart
 */

import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function ExpiryChart({ stats }) {
  const data = {
    labels: ["Safe", "Expiring Soon", "Urgent", "Expired"],
    datasets: [
      {
        data: [
          stats?.safe || 0,
          stats?.expiring_soon || 0,
          stats?.urgent || 0,
          stats?.expired || 0,
        ],
        backgroundColor: [
          "rgba(52, 211, 153, 0.8)",
          "rgba(251, 191, 36, 0.8)",
          "rgba(251, 146, 60, 0.8)",
          "rgba(248, 113, 113, 0.8)",
        ],
        borderColor: [
          "rgba(52, 211, 153, 1)",
          "rgba(251, 191, 36, 1)",
          "rgba(251, 146, 60, 1)",
          "rgba(248, 113, 113, 1)",
        ],
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "65%",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#9ca3af",
          padding: 16,
          font: { family: "'DM Sans'", size: 12 },
          usePointStyle: true,
          pointStyleWidth: 8,
        },
      },
      tooltip: {
        backgroundColor: "#1a1a24",
        borderColor: "#3d3d52",
        borderWidth: 1,
        titleColor: "#e5e7eb",
        bodyColor: "#9ca3af",
        padding: 12,
      },
    },
  };

  return (
    <div className="card p-5">
      <h3 className="font-display font-semibold text-white mb-4">
        Status Distribution
      </h3>
      <div style={{ height: "220px" }}>
        <Doughnut data={data} options={options} />
      </div>
    </div>
  );
}
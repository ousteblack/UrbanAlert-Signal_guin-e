import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function IncidentChart({ incidents = [] }) {
  const labels = [];
  const newCounts = [];
  const resolvedCounts = [];
  
  const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
  const now = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(monthNames[d.getMonth()]);
    newCounts.push(0);
    resolvedCounts.push(0);
  }

  incidents.forEach(inc => {
    const dateStr = inc.createdAt || inc.date;
    if (dateStr) {
      const date = new Date(dateStr);
      // find which of the last 7 months it belongs to
      for (let i = 0; i < 7; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - (6 - i), 1);
        if (date.getFullYear() === d.getFullYear() && date.getMonth() === d.getMonth()) {
           if (inc.status?.toLowerCase() === 'résolu') resolvedCounts[i]++;
           else newCounts[i]++;
           break;
        }
      }
    }
  });

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          font: { family: "'Inter', sans-serif" }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleFont: { family: "'Inter', sans-serif", size: 14 },
        bodyFont: { family: "'Inter', sans-serif", size: 13 },
        padding: 12,
        cornerRadius: 8,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(241, 245, 249, 1)",
          drawBorder: false,
        },
        ticks: { font: { family: "'Inter', sans-serif" } }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: { font: { family: "'Inter', sans-serif" } }
      },
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
  };

  const data = {
    labels: labels,
    datasets: [
      {
        label: "Nouveaux incidents",
        data: newCounts,
        borderColor: "#F97316", // accent
        backgroundColor: "rgba(249, 115, 22, 0.1)",
        borderWidth: 2,
        pointBackgroundColor: "#F97316",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4,
      },
      {
        label: "Incidents résolus",
        data: resolvedCounts,
        borderColor: "#10B981", // success
        backgroundColor: "transparent",
        borderWidth: 2,
        borderDash: [5, 5],
        pointBackgroundColor: "#10B981",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: false,
        tension: 0.4,
      },
    ],
  };

  return <Line options={options} data={data} />;
}

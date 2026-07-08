import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function SeasonalChart({ incidents = [] }) {
  const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
  
  // Create arrays for 12 months
  const inondationCounts = Array(12).fill(0);
  const voirieCounts = Array(12).fill(0);

  incidents.forEach(inc => {
    const dateStr = inc.createdAt || inc.date;
    const type = (inc.type || inc.category)?.toLowerCase() || "";
    
    if (dateStr) {
      const date = new Date(dateStr);
      const monthIndex = date.getMonth(); // 0 to 11
      
      if (type.includes('inondation') || type.includes('eau')) {
          inondationCounts[monthIndex]++;
      } else if (type.includes('nid') || type.includes('voirie') || type.includes('route')) {
          voirieCounts[monthIndex]++;
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
        ticks: { font: { family: "'Inter', sans-serif" }, stepSize: 1 }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: { font: { family: "'Inter', sans-serif" } }
      },
    },
  };

  const data = {
    labels: monthNames,
    datasets: [
      {
        label: "Inondations / Problèmes d'eau",
        data: inondationCounts,
        backgroundColor: "#3B82F6", // blue for water/floods
        borderRadius: 4,
      },
      {
        label: "Voirie dégradée / Routes",
        data: voirieCounts,
        backgroundColor: "#F59E0B", // orange for roads
        borderRadius: 4,
      },
    ],
  };

  return <Bar options={options} data={data} />;
}

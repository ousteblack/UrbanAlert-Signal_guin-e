import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function CategoryChart({ incidents = [] }) {
  const counts = [0, 0, 0, 0, 0, 0];
  
  incidents.forEach(inc => {
      const type = (inc.type || inc.category)?.toLowerCase() || "";
      if (type.includes('nid') || type.includes('voirie')) counts[0]++;
      else if (type.includes('propret')) counts[1]++;
      else if (type.includes('eclairage') || type.includes('éclairage')) counts[2]++;
      else if (type.includes('vert')) counts[3]++;
      else if (type.includes('danger') || type.includes('sécurité')) counts[4]++;
      else counts[5]++;
  });

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleFont: { family: "'Inter', sans-serif", size: 14 },
        bodyFont: { family: "'Inter', sans-serif", size: 13 },
        padding: 12,
        cornerRadius: 8,
      }
    },
    cutout: "70%",
  };

  const data = {
    labels: [
      "Infrastructures", 
      "Propreté", 
      "Éclairage public", 
      "Espaces verts",
      "Sécurité/Danger",
      "Autre"
    ],
    datasets: [
      {
        data: counts,
        backgroundColor: [
          "#3B82F6", // primary-light
          "#10B981", // success
          "#F59E0B", // warning
          "#8B5CF6", // purple
          "#EF4444", // danger
          "#64748B", // slate
        ],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="relative flex-grow min-h-[150px] flex justify-center">
        <Doughnut data={data} options={options} />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-bold text-text-main leading-none mb-1">{incidents.length}</span>
          <span className="text-sm text-text-muted font-medium">Total</span>
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm mx-auto">
        {data.labels.map((label, index) => (
          <div key={label} className="flex items-center gap-2">
            <span 
              className="w-3 h-3 rounded-full shrink-0" 
              style={{ backgroundColor: data.datasets[0].backgroundColor[index] }}
            ></span>
            <span className="text-text-muted truncate">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

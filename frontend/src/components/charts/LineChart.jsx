import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const LineChart = ({ data, title, height = 300, fill = false, className }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: !!title,
        text: title
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  if (fill && data.datasets) {
    data.datasets = data.datasets.map(ds => ({ ...ds, fill: true }));
  }

  return (
    <div className={className} style={{ height }}>
      <Line options={options} data={data} />
    </div>
  );
};

export default LineChart;
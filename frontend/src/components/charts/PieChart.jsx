import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const PieChart = ({ data, title, height = 300, className }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: !!title,
        text: title
      }
    }
  };

  return (
    <div className={className} style={{ height }}>
      <Pie options={options} data={data} />
    </div>
  );
};

export default PieChart;
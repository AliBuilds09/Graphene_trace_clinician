import React from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    LineElement,
    PointElement,
    CategoryScale,
    LinearScale,
    TimeScale,
    Tooltip,
    Legend,
} from 'chart.js';
import 'chartjs-adapter-date-fns'; // For time scale

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, TimeScale, Tooltip, Legend);

const LineChart = ({ labels, dataPoints }) => {
    const data = {
        labels,
        datasets: [
            {
                label: 'Peak Pressure (mmHg)',
                data: dataPoints,
                fill: false,
                borderColor: 'rgb(255, 99, 132)',
                tension: 0.3,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: { display: true },
        },
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'second',
                    displayFormats: {
                        second: 'HH:mm:ss',
                    },
                },
                title: {
                    display: true,
                    text: 'Time',
                },
            },
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Peak Pressure (mmHg)',
                },
            },
        },
    };

    return <Line data={data} options={options} />;
};

export default LineChart;
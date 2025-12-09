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
    Filler,
} from 'chart.js';
import 'chartjs-adapter-date-fns'; // For time scale

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, TimeScale, Tooltip, Legend, Filler);

const LineChart = ({ labels, dataPoints }) => {

    const data = {
        labels,
        datasets: [
            {
                label: 'Peak Pressure (mmHg)',
                data: dataPoints,
                fill: true,
                backgroundColor: 'rgba(255, 99, 132, 0.15)', // Light fill below line
                borderColor: 'rgb(255, 99, 132)',
                pointBackgroundColor: 'rgb(255, 99, 132)',
                pointRadius: 4,
                pointHoverRadius: 7,
                tension: 0.3,
                borderWidth: 3,
                hoverBorderWidth: 4,
                hoverBorderColor: 'rgb(220,20,60)',
                cubicInterpolationMode: 'monotone',
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'nearest',
            intersect: false,
        },
        plugins: {
            legend: {
                display: true,
                position: 'top',
                labels: {
                    font: {
                        size: 14,
                        weight: 'bold',
                        family: 'Poppins, sans-serif',
                    },
                    color: '#333',
                },
            },
            tooltip: {
                enabled: true,
                backgroundColor: 'rgba(0,0,0,0.75)',
                titleFont: { size: 14, weight: 'bold' },
                bodyFont: { size: 13 },
                padding: 10,
                cornerRadius: 6,
                callbacks: {
                    title: ctx => `Time: ${ctx[0].label}`,
                    label: ctx => `Pressure: ${ctx.parsed.y} mmHg`,
                },
            },
        },
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'second',
                    tooltipFormat: 'PPpp',
                    displayFormats: {
                        second: 'HH:mm:ss',
                    },
                },
                title: {
                    display: true,
                    text: 'Time',
                    font: {
                        size: 16,
                        weight: 'bold',
                        family: 'Poppins, sans-serif',
                    },
                    color: '#333',
                },
                grid: {
                    color: 'rgba(200,200,200,0.3)',
                },
                ticks: {
                    color: '#666',
                    font: { size: 12 },
                    maxRotation: 45,
                    minRotation: 45,
                },
            },
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Peak Pressure (mmHg)',
                    font: {
                        size: 16,
                        weight: 'bold',
                        family: 'Poppins, sans-serif',
                    },
                    color: '#333',
                },
                grid: {
                    color: 'rgba(200,200,200,0.3)',
                },
                ticks: {
                    color: '#666',
                    font: { size: 12 },
                    callback: val => `${val} mmHg`,
                },
            },
        },
        animation: {
            duration: 1500,
            easing: 'easeInOutQuart',
        },
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '350px', fontFamily: 'Poppins, sans-serif' }}>
            <Line data={data} options={options} />
        </div>
    );
};

export default LineChart;
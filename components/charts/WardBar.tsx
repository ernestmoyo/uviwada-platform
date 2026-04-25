'use client'

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

interface WardBarProps {
  rows: Array<{ ward: string; count: number }>
}

export function WardBar({ rows }: WardBarProps) {
  return (
    <Bar
      data={{
        labels: rows.map((r) => r.ward),
        datasets: [
          {
            label: 'Centres',
            data: rows.map((r) => r.count),
            backgroundColor: '#1A5FAA',
            borderRadius: 4
          }
        ]
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } },
          x: { grid: { display: false }, ticks: { font: { size: 10 } } }
        }
      }}
    />
  )
}

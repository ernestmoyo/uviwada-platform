'use client'

import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

interface MembershipLineProps {
  labels: string[]
  data: number[]
}

export function MembershipLine({ labels, data }: MembershipLineProps) {
  return (
    <Line
      data={{
        labels,
        datasets: [
          {
            label: 'Members',
            data,
            borderColor: '#1A5FAA',
            backgroundColor: 'rgba(26,95,170,0.08)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#1A5FAA',
            pointRadius: 4,
            pointHoverRadius: 6,
            borderWidth: 2.5
          }
        ]
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: false,
            grid: { color: 'rgba(0,0,0,0.04)' },
            ticks: { font: { size: 11, family: 'Inter' } }
          },
          x: { grid: { display: false }, ticks: { font: { size: 11, family: 'Inter' } } }
        }
      }}
    />
  )
}

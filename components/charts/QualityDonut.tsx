'use client'

import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

interface QualityDonutProps {
  counts: { green: number; amber: number; red: number }
}

export function QualityDonut({ counts }: QualityDonutProps) {
  return (
    <Doughnut
      data={{
        labels: ['Good (Green)', 'Needs Improvement (Amber)', 'Below Standard (Red)'],
        datasets: [
          {
            data: [counts.green, counts.amber, counts.red],
            backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
            borderWidth: 0
          }
        ]
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { font: { size: 11, family: 'Inter' }, padding: 12, usePointStyle: true }
          }
        }
      }}
    />
  )
}

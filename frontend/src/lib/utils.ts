import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function scoreColor(score: number): string {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  return 'text-red-600'
}

export function scoreBg(score: number): string {
  if (score >= 80) return 'bg-green-100 text-green-800'
  if (score >= 60) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}

export function severityColor(severity: 'LOW' | 'MEDIUM' | 'HIGH'): string {
  switch (severity) {
    case 'HIGH':   return 'bg-red-100 text-red-800'
    case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
    case 'LOW':    return 'bg-blue-100 text-blue-800'
  }
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
}

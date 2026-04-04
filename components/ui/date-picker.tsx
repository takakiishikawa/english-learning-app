"use client"

import { DayPicker } from "react-day-picker"

function toDate(str: string): Date {
  return new Date(str + "T00:00:00")
}

function toStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function DatePicker({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const selected = value ? toDate(value) : undefined

  return (
    <div className="rounded-lg border border-input bg-background p-1">
      <DayPicker
        mode="single"
        selected={selected}
        defaultMonth={selected ?? new Date()}
        onSelect={(date) => {
          if (date) onChange(toStr(date))
        }}
      />
    </div>
  )
}

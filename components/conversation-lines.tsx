export function ConversationLines({
  lines,
  currentLine,
}: {
  lines: string[]
  currentLine: number
}) {
  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        const isA = line.startsWith("A:")
        const isB = line.startsWith("B:")
        return (
          <div
            key={i}
            className={`rounded-lg px-3 py-2 text-base transition-colors ${
              i === currentLine
                ? isA
                  ? "bg-blue-600 text-white"
                  : "bg-amber-600 text-white"
                : isA
                ? "bg-blue-50 text-blue-800"
                : isB
                ? "bg-amber-50 text-amber-800"
                : "bg-muted"
            }`}
          >
            {line}
          </div>
        )
      })}
    </div>
  )
}

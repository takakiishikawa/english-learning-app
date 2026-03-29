export interface Grammar {
  id: string
  name: string
  summary: string
  detail: string | null
  examples: string
  usage_scene: string
  frequency: number
  play_count: number
  last_played_at: string | null
  created_at: string
}

export interface Expression {
  id: string
  category: string
  expression: string
  meaning: string
  conversation: string
  usage_scene: string
  frequency: number
  play_count: number
  last_played_at: string | null
  created_at: string
}

export interface Lesson {
  id: string
  level: number
  lesson_no: string
  topic: string
  status: "未受講" | "try" | "Done"
}

export interface PracticeLog {
  id: string
  practiced_at: string
  created_at: string
}

export interface ExtractedGrammar {
  name: string
  summary: string
  detail?: string
  examples: string[]
  usage_scene: string
  frequency: number
}

export interface ExtractedExpression {
  category: string
  expression: string
  meaning: string
  conversation: string[]
  usage_scene: string
  frequency: number
}

export interface ExtractResult {
  grammar: ExtractedGrammar[]
  expressions: ExtractedExpression[]
}

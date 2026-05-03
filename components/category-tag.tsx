import { Tag } from "@takaki/go-design-system";

const TAG_COLORS = [
  "primary",
  "success",
  "warning",
  "danger",
  "info",
] as const;

type TagColor = (typeof TAG_COLORS)[number] | "default";

function colorForCategory(category: string): TagColor {
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = (hash * 31 + category.charCodeAt(i)) | 0;
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

export function CategoryTag({ category }: { category?: string | null }) {
  if (!category) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  return <Tag color={colorForCategory(category)}>{category}</Tag>;
}

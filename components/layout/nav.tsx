"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  PlusCircle,
  BookOpen,
  MessageSquare,
  GraduationCap,
  List,
  ListChecks,
  LogOut,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/add", label: "教材追加", icon: PlusCircle },
  { href: "/repeating/grammar", label: "文法練習", icon: BookOpen },
  { href: "/repeating/expression", label: "表現練習", icon: MessageSquare },
  { href: "/lessons", label: "レッスン管理", icon: GraduationCap },
  { href: "/grammar", label: "文法一覧", icon: List },
  { href: "/expressions", label: "表現一覧", icon: ListChecks },
]

export function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <nav className="flex h-screen w-56 flex-col border-r bg-card px-3 py-4">
      <div className="mb-6 px-2">
        <h1 className="text-lg font-bold tracking-tight">English Learning</h1>
      </div>
      <div className="flex flex-1 flex-col gap-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === href
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignOut}
        className="mt-auto flex items-center gap-2 justify-start text-muted-foreground"
      >
        <LogOut className="h-4 w-4" />
        ログアウト
      </Button>
    </nav>
  )
}

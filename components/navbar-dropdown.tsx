"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface DropdownItem {
  href: string
  label: string
}

interface NavbarDropdownProps {
  label: string
  items: DropdownItem[]
}

export function NavbarDropdown({ label, items }: NavbarDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setTimeout(() => setOpen(false), 100)}
        className={cn(
          "flex items-center gap-1 px-3 py-2 text-sm font-semibold transition-all duration-200 rounded-lg relative group",
          open ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-primary hover:bg-muted/50"
        )}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {label}
        <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", open && "rotate-180")} />
        <span className={cn(
          "absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-primary to-accent transition-all duration-300 rounded-full -translate-x-1/2",
          open && "w-[calc(100%-0.75rem)]"
        )} />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-2 w-52 py-2 bg-background/95 backdrop-blur-xl glass-strong border border-border/50 rounded-xl shadow-2xl z-50 animate-scale-in"
          onMouseLeave={() => setOpen(false)}
          onMouseEnter={() => setOpen(true)}
          role="menu"
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "block px-4 py-2.5 text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors duration-200 rounded-lg mx-2",
                "first:rounded-t-xl last:rounded-b-xl"
              )}
              role="menuitem"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
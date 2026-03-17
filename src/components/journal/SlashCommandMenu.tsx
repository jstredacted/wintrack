import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import type { SlashCommandItem } from './SlashCommand'

interface SlashCommandMenuProps {
  items: SlashCommandItem[]
  command: (item: SlashCommandItem) => void
  clientRect?: () => DOMRect | null
}

export interface SlashCommandMenuHandle {
  onKeyDown: (event: KeyboardEvent) => boolean
}

const SlashCommandMenu = forwardRef<SlashCommandMenuHandle, SlashCommandMenuProps>(
  ({ items, command, clientRect }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    useEffect(() => {
      setSelectedIndex(0)
    }, [items])

    useImperativeHandle(ref, () => ({
      onKeyDown(event: KeyboardEvent) {
        if (event.key === 'ArrowUp') {
          setSelectedIndex(i => (i + items.length - 1) % items.length)
          return true
        }
        if (event.key === 'ArrowDown') {
          setSelectedIndex(i => (i + 1) % items.length)
          return true
        }
        if (event.key === 'Enter') {
          const item = items[selectedIndex]
          if (item) {
            command(item)
          }
          return true
        }
        if (event.key === 'Escape') {
          return true
        }
        return false
      },
    }))

    if (!items.length) return null

    const rect = clientRect?.()
    const style: React.CSSProperties = rect
      ? {
          position: 'fixed',
          top: rect.bottom + 4,
          left: rect.left,
          zIndex: 9999,
        }
      : { position: 'fixed', zIndex: 9999 }

    return (
      <div
        style={style}
        className="min-w-[140px] max-w-[180px] bg-popover border border-border rounded-sm shadow-md py-1"
      >
        {items.map((item, index) => (
          <button
            key={item.title}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault()
              command(item)
            }}
            className={`w-full text-left px-3 py-1 text-sm font-mono cursor-pointer transition-colors
              ${index === selectedIndex
                ? 'bg-accent text-accent-foreground'
                : 'hover:bg-accent hover:text-accent-foreground'
              }`}
          >
            {item.title}
          </button>
        ))}
      </div>
    )
  }
)

SlashCommandMenu.displayName = 'SlashCommandMenu'

export default SlashCommandMenu

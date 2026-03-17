import { Extension } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'
import { ReactRenderer } from '@tiptap/react'
import type { Editor, Range } from '@tiptap/core'
import SlashCommandMenu from './SlashCommandMenu'
import type { RefObject } from 'react'

export interface SlashCommandItem {
  title: string
  command: (editor: Editor, range: Range) => void
}

export const slashCommands: SlashCommandItem[] = [
  {
    title: '/h2 — Heading 2',
    command: (editor, range) =>
      editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run(),
  },
  {
    title: '/h3 — Heading 3',
    command: (editor, range) =>
      editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run(),
  },
  {
    title: '/bullet — Bullet list',
    command: (editor, range) =>
      editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    title: '/numbered — Numbered list',
    command: (editor, range) =>
      editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    title: '/bold — Bold',
    command: (editor, range) =>
      editor.chain().focus().deleteRange(range).toggleBold().run(),
  },
  {
    title: '/italic — Italic',
    command: (editor, range) =>
      editor.chain().focus().deleteRange(range).toggleItalic().run(),
  },
]

interface SuggestionProps {
  editor: Editor
  range: Range
  props: {
    items: SlashCommandItem[]
    command: (item: SlashCommandItem) => void
    clientRect?: () => DOMRect | null
  }
}

const SlashCommand = Extension.create({
  name: 'slashCommand',
  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({ editor, range, props }: SuggestionProps) => {
          props.command({ editor, range } as unknown as SlashCommandItem)
        },
      },
    }
  },
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        items: ({ query }: { query: string }) => {
          return slashCommands.filter(item =>
            item.title.toLowerCase().includes(query.toLowerCase())
          )
        },
        render: () => {
          let component: ReactRenderer | null = null

          return {
            onStart: (props: unknown) => {
              component = new ReactRenderer(SlashCommandMenu, {
                props: props as Record<string, unknown>,
                editor: (props as { editor: Editor }).editor,
              })
              document.body.appendChild(component.element as Node)
            },
            onUpdate: (props: unknown) => {
              component?.updateProps(props as Record<string, unknown>)
            },
            onKeyDown: (props: { event: KeyboardEvent }) => {
              const ref = component?.ref as RefObject<{ onKeyDown: (e: KeyboardEvent) => boolean }> | null
              if (ref?.current?.onKeyDown) {
                return ref.current.onKeyDown(props.event)
              }
              return false
            },
            onExit: () => {
              if (component?.element?.parentNode) {
                component.element.parentNode.removeChild(component.element)
              }
              component?.destroy()
              component = null
            },
          }
        },
      }),
    ]
  },
})

export default SlashCommand

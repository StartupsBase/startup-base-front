import * as React from "react"
import type { Editor } from "@tiptap/react"
import type { Content, UseEditorOptions } from "@tiptap/react"
import { StarterKit } from "@tiptap/starter-kit"
import { useEditor } from "@tiptap/react"
import { Typography } from "@tiptap/extension-typography"
import { TextStyle } from "@tiptap/extension-text-style"
import { Placeholder, Selection } from "@tiptap/extensions"
import { Markdown } from "@tiptap/markdown"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { TableKit } from "@tiptap/extension-table"
import {
  Image,
  HorizontalRule,
  CodeBlockLowlight,
  Color,
  UnsetAllMarks,
  ResetMarksOnEnter,
  FileHandler,
  MarkdownPaste,
} from "../extensions"
import type { UploadReturnType } from "../extensions/image/image"
import { cn } from "@workspace/ui/lib/utils"
import { getOutput, randomId } from "../utils"
import { useThrottle } from "../hooks/use-throttle"
import { toast } from "sonner"

export interface UseMinimalTiptapEditorProps extends UseEditorOptions {
  value?: Content
  output?: "html" | "json" | "text" | "markdown"
  placeholder?: string
  editorClassName?: string
  throttleDelay?: number
  onUpdate?: (content: Content) => void
  onBlur?: (content: Content) => void
  uploader?: (file: File) => Promise<UploadReturnType>
}

const createExtensions = ({
  placeholder,
  uploader,
  output = "html",
}: {
  placeholder: string
  uploader?: (file: File) => Promise<UploadReturnType>
  output: UseMinimalTiptapEditorProps["output"]
}) => [
  StarterKit.configure({
    blockquote: { HTMLAttributes: { class: "block-node" } },
    // bold
    bulletList: { HTMLAttributes: { class: "list-node" } },
    code: { HTMLAttributes: { class: "inline", spellcheck: "false" } },
    codeBlock: false,
    // document
    dropcursor: { width: 2, class: "ProseMirror-dropcursor border" },
    // gapcursor
    // hardBreak
    heading: { HTMLAttributes: { class: "heading-node" } },
    // undoRedo
    horizontalRule: false,
    // italic
    // listItem
    // listKeymap
    link: {
      enableClickSelection: true,
      openOnClick: false,
      HTMLAttributes: {
        class: "link",
      },
    },
    orderedList: { HTMLAttributes: { class: "list-node" } },
    paragraph: { HTMLAttributes: { class: "text-node" } },
    // strike
    // text
    // underline
    // trailingNode
  }),

  Image.configure({
    allowedMimeTypes: ["image/*"],
    maxFileSize: 5 * 1024 * 1024,
    allowBase64: false,
    uploadFn: async (file) => {
      if (!uploader) {
        throw new Error("An attachment uploader is required to insert images")
      }

      return uploader(file)
    },
    onToggle(editor, files, pos) {
      void uploadAndInsertImages(editor, files, uploader, pos)
    },
    onImageRemoved({ id, src }) {
      console.log("Image removed", { id, src })
    },
    onValidationError(errors) {
      errors.forEach((error) => {
        toast.error("Image validation error", {
          position: "bottom-right",
          description: error.reason,
        })
      })
    },
    onActionSuccess({ action }) {
      const mapping = {
        copyImage: "Copy Image",
        copyLink: "Copy Link",
        download: "Download",
      }
      toast.success(mapping[action], {
        position: "bottom-right",
        description: "Image action success",
      })
    },
    onActionError(error, { action }) {
      const mapping = {
        copyImage: "Copy Image",
        copyLink: "Copy Link",
        download: "Download",
      }
      toast.error(`Failed to ${mapping[action]}`, {
        position: "bottom-right",
        description: error.message,
      })
    },
  }),
  FileHandler.configure({
    allowBase64: false,
    allowedMimeTypes: ["image/*"],
    maxFileSize: 5 * 1024 * 1024,
    onDrop: (editor, files, pos) => {
      void uploadAndInsertImages(editor, files, uploader, pos)
    },
    onPaste: (editor, files) => {
      void uploadAndInsertImages(editor, files, uploader)
    },
    onValidationError: (errors) => {
      errors.forEach((error) => {
        toast.error("Image validation error", {
          position: "bottom-right",
          description: error.reason,
        })
      })
    },
  }),
  Color,
  TextStyle,
  Selection,
  Typography,
  UnsetAllMarks,
  HorizontalRule,
  ResetMarksOnEnter,
  CodeBlockLowlight,
  Placeholder.configure({ placeholder: () => placeholder }),
  // Add MarkdownPaste extension when output is markdown
  ...(output === "markdown"
    ? [
        // Markdown with GFM support for tables, task lists, etc.
        Markdown.configure({
          markedOptions: {
            gfm: true,
          },
        }),
        // Task lists (checkboxes)
        TaskList.configure({
          HTMLAttributes: { class: "task-list-node" },
        }),
        TaskItem.configure({
          nested: true,
        }),
        // Tables
        TableKit.configure({
          table: {
            resizable: true,
            HTMLAttributes: { class: "table-node" },
          },
        }),
        MarkdownPaste,
      ]
    : []),
]

async function uploadAndInsertImages(
  editor: Editor,
  files: File[],
  uploader: UseMinimalTiptapEditorProps["uploader"],
  position?: number
) {
  if (!uploader) {
    toast.error("Image upload is unavailable", {
      position: "bottom-right",
      description: "No attachment uploader has been configured.",
    })
    return
  }

  try {
    const uploads = await Promise.all(files.map((file) => uploader(file)))
    const content = uploads.map((upload, index) => ({
      type: "image",
      attrs: {
        id: typeof upload === "string" ? randomId() : upload.id,
        src: typeof upload === "string" ? upload : upload.src,
        alt: files[index]?.name,
        title: files[index]?.name,
        fileName: files[index]?.name,
      },
    }))

    if (position === undefined) editor.commands.insertContent(content)
    else editor.commands.insertContentAt(position, content)
  } catch (error) {
    toast.error("Image upload failed", {
      position: "bottom-right",
      description: error instanceof Error ? error.message : "Please try again.",
    })
  }
}

export const useMinimalTiptapEditor = ({
  value,
  output = "html",
  placeholder = "",
  editorClassName,
  throttleDelay = 0,
  onUpdate,
  onBlur,
  uploader,
  editorProps,
  ...props
}: UseMinimalTiptapEditorProps) => {
  const throttledSetValue = useThrottle(
    (value: Content) => onUpdate?.(value),
    throttleDelay
  )

  const handleUpdate = React.useCallback(
    (editor: Editor) => throttledSetValue(getOutput(editor, output)),
    [output, throttledSetValue]
  )

  const handleCreate = React.useCallback(
    (editor: Editor) => {
      if (value && editor.isEmpty) {
        editor.commands.setContent(value, {
          contentType: output === "markdown" ? "markdown" : undefined,
        })
      }
    },
    [value, output]
  )

  const handleBlur = React.useCallback(
    (editor: Editor) => onBlur?.(getOutput(editor, output)),
    [output, onBlur]
  )

  const editor = useEditor({
    immediatelyRender: false,
    extensions: createExtensions({ placeholder, uploader, output }),
    editorProps: {
      ...editorProps,
      attributes: (state) => {
        const attributes =
          typeof editorProps?.attributes === "function"
            ? editorProps.attributes(state)
            : editorProps?.attributes

        return {
          ...attributes,
          autocomplete: attributes?.autocomplete ?? "off",
          autocorrect: attributes?.autocorrect ?? "off",
          autoUpperCase: attributes?.autoUpperCase ?? "off",
          class: cn(
            "focus:outline-hidden",
            editorClassName,
            attributes?.class
          ),
        }
      },
    },
    onUpdate: ({ editor }) => handleUpdate(editor),
    onCreate: ({ editor }) => handleCreate(editor),
    onBlur: ({ editor }) => handleBlur(editor),
    ...props,
  })

  return editor
}

export default useMinimalTiptapEditor

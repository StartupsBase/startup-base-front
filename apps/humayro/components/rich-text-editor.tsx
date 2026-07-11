"use client"

import {
  MinimalTiptapEditor,
  type MinimalTiptapProps,
} from "@workspace/ui/components/minimal-tiptap"

import { uploadTiptapAttachment } from "@/lib/tiptap-attachment"

export function RichTextEditor(
  props: Omit<MinimalTiptapProps, "uploader">
) {
  return <MinimalTiptapEditor {...props} uploader={uploadTiptapAttachment} />
}

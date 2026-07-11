import { upload } from "@/lib/api/generated/attachment-controller/attachment-controller"

export async function uploadTiptapAttachment(file: File) {
  const attachment = await upload({ file })

  if (!attachment.s3Url) {
    throw new Error("The attachment service returned no image URL")
  }

  return attachment.id === undefined
    ? attachment.s3Url
    : { id: attachment.id, src: attachment.s3Url }
}

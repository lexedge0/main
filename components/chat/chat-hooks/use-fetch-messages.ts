// components/chat/chat-hooks/useFetchMessages.ts
import { useContext } from "react"
import { ChatbotUIContext } from "@/context/context"
import { getMessagesByChatId } from "@/db/messages"
import { getMessageFileItemsByMessageId } from "@/db/message-file-items"
import { getMessageImageFromStorage } from "@/db/storage/message-images"
import { getChatFilesByChatId } from "@/db/chat-files"
import { convertBlobToBase64 } from "@/lib/blob-to-b64"

export const useFetchMessages = (chatId: string | undefined) => {
  const {
    setChatImages,
    setChatFileItems,
    setChatFiles,
    setChatMessages,
    setShowFilesDisplay,
    setUseRetrieval
  } = useContext(ChatbotUIContext)

  const fetchMessages = async () => {
    if (!chatId) {
      return
    }

    try {
      const fetchedMessages = await getMessagesByChatId(chatId)

      const imagePromises = fetchedMessages.flatMap(
        message =>
          message.image_paths?.map(async imagePath => {
            const url = await getMessageImageFromStorage(imagePath)
            if (!url) return null

            const response = await fetch(url)
            const blob = await response.blob()
            const base64 = await convertBlobToBase64(blob)

            return {
              messageId: message.id,
              path: imagePath,
              base64,
              url,
              file: null
            }
          }) ?? []
      )

      const images = (await Promise.all(imagePromises)).filter(Boolean)
      setChatImages(images)

      const messageFileItems = await Promise.all(
        fetchedMessages.map(message =>
          getMessageFileItemsByMessageId(message.id)
        )
      )

      const uniqueFileItems = messageFileItems.flatMap(item => item.file_items)
      setChatFileItems(uniqueFileItems)

      const chatFiles = await getChatFilesByChatId(chatId)
      setChatFiles(
        chatFiles.files.map(file => ({
          id: file.id,
          name: file.name,
          type: file.type,
          file: null
        }))
      )

      const fetchedChatMessages = fetchedMessages.map(message => {
        return {
          message,
          fileItems: messageFileItems
            .filter(messageFileItem => messageFileItem.id === message.id)
            .flatMap(messageFileItem =>
              messageFileItem.file_items.map(fileItem => fileItem.id)
            )
        }
      })

      setUseRetrieval(true)
      setShowFilesDisplay(true)

      setChatMessages(fetchedChatMessages) // Adjust according to your state structure
    } catch (error) {
      console.error("Failed to fetch messages:", error)
    }
  }

  return { fetchMessages }
}

// components/chat/chat-hooks/useFetchChat.ts
import { useContext } from "react"
import { ChatbotUIContext } from "@/context/context"
import { getChatById } from "@/db/chats"
import { useState } from "react"
import { LLMID } from "@/types"

export const useFetchChat = (chatId: string | undefined) => {
  const { setSelectedChat, setChatSettings } = useContext(ChatbotUIContext)
  const [loading, setLoading] = useState(true)

  const fetchChat = async () => {
    if (!chatId) {
      return
    }

    try {
      const chat = await getChatById(chatId)
      if (!chat) {
        setLoading(false)
        return
      }

      setSelectedChat(chat)
      setChatSettings({
        model: chat.model as LLMID,
        prompt: chat.prompt,
        temperature: chat.temperature,
        contextLength: chat.context_length,
        includeProfileContext: chat.include_profile_context,
        includeWorkspaceInstructions: chat.include_workspace_instructions,
        embeddingsProvider:
          (process.env.EMBEDDINGS_PROVIDER as "openai" | "local") || "openai"
      })
    } catch (error) {
      console.error("Failed to fetch chat details:", error)
    }
  }

  return { fetchChat }
}

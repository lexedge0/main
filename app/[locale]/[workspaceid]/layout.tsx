"use client"

import { Dashboard } from "@/components/ui/dashboard"
import { ChatbotUIContext } from "@/context/context"
import { getChatsByWorkspaceId } from "@/db/chats"
import { getCollectionWorkspacesByWorkspaceId } from "@/db/collections"
import { getFileWorkspacesByWorkspaceId } from "@/db/files"
import { getFoldersByWorkspaceId } from "@/db/folders"
import { getWorkspaceById } from "@/db/workspaces"
import { convertBlobToBase64 } from "@/lib/blob-to-b64"
import { supabase } from "@/lib/supabase/browser-client"
import { LLMID } from "@/types"
import { useParams, useRouter } from "next/navigation"
import { ReactNode, useContext, useEffect, useState, useCallback } from "react"
import Loading from "../loading"

interface WorkspaceLayoutProps {
  children: ReactNode
}

export default function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const router = useRouter()

  const params = useParams()
  const workspaceId = params.workspaceid as string

  const {
    setChatSettings,
    setChats,
    setCollections,
    setFolders,
    setFiles,
    selectedWorkspace,
    setSelectedWorkspace,
    setSelectedChat,
    setChatMessages,
    setUserInput,
    setIsGenerating,
    setFirstTokenReceived,
    setChatFiles,
    setChatImages,
    setNewMessageFiles,
    setNewMessageImages,
    setShowFilesDisplay
  } = useContext(ChatbotUIContext)

  const [loading, setLoading] = useState(true)

  const fetchWorkspaceData = useCallback(
    async (workspaceId: string) => {
      setLoading(true)

      const workspace = await getWorkspaceById(workspaceId)
      setSelectedWorkspace(workspace)

      const chats = await getChatsByWorkspaceId(workspaceId)
      setChats(chats)

      const collectionData =
        await getCollectionWorkspacesByWorkspaceId(workspaceId)
      setCollections(collectionData.collections)

      const folders = await getFoldersByWorkspaceId(workspaceId)
      setFolders(folders)

      const fileData = await getFileWorkspacesByWorkspaceId(workspaceId)
      setFiles(fileData.files)
      setChatSettings({
        model: (process.env.LLM_TO_USE || "claude-2.1") as LLMID,
        prompt:
          process.env.SYSTEM_PROMPT ||
          "You are a friendly, helpful AI assistant.",
        temperature: parseFloat(process.env.DEFAULT_TEMPERATURE || "0.5"),
        contextLength: parseInt(
          process.env.DEFAULT_CONTEXT_LENGTH || "4096",
          10
        ),
        includeProfileContext: process.env.INCLUDE_PROFILE_CONTEXT === "true",
        includeWorkspaceInstructions:
          process.env.INCLUDE_WORKSPACE_INSTRUCTIONS === "true",
        embeddingsProvider:
          (process.env.EMBEDDINGS_PROVIDER as "openai" | "local") || "openai"
      })

      setLoading(false)
    },
    [
      setChatSettings,
      setChats,
      setCollections,
      setFiles,
      setFolders,
      setSelectedWorkspace
    ]
  )

  useEffect(() => {
    ;(async () => {
      const session = (await supabase.auth.getSession()).data.session

      if (!session) {
        return router.push("/login")
      } else {
        await fetchWorkspaceData(workspaceId)
      }
    })()
  }, [router, workspaceId, fetchWorkspaceData])

  useEffect(() => {
    ;(async () => await fetchWorkspaceData(workspaceId))()

    setUserInput("")
    setChatMessages([])
    setSelectedChat(null)

    setIsGenerating(false)
    setFirstTokenReceived(false)

    setChatFiles([])
    setChatImages([])
    setNewMessageFiles([])
    setNewMessageImages([])
    setShowFilesDisplay(false)
  }, [
    workspaceId,
    fetchWorkspaceData,
    setUserInput,
    setChatMessages,
    setSelectedChat,
    setIsGenerating,
    setFirstTokenReceived,
    setChatFiles,
    setChatImages,
    setNewMessageFiles,
    setNewMessageImages,
    setShowFilesDisplay
  ])

  if (loading) {
    return <Loading />
  }

  return <Dashboard>{children}</Dashboard>
}

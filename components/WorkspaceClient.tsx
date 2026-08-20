"use client"

import { CodePanel } from "./Codepanel"
import { useCallback, useState } from "react"
import { FileData, Message, StatusStep } from "@/types/workspace"
import ChatPanel from "./ChatPanel"

interface WorkspaceClientProps {
initialPrompt: string | null;
userCredits : number;
userId : string;
userPlan : string;
}

const WorkspaceClient = ({ initialPrompt , userCredits, userId , userPlan  }: WorkspaceClientProps) => {
  const [fileData, setFileData] = useState<FileData | null>(null)
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusLog, setStatusLog] = useState<StatusStep[]>([])
  const [credits, setCredits] = useState(userCredits);
  const [workspaceId , setWorkspaceId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const handleFilePatch = useCallback((patches: FileData) => {
    setFileData(patches);
  }, [])

  const handleGenerate = useCallback(async (prompt: string, imageUrl?: string) => {

  }, [credits, isGenerating, userId])

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-[#0a0a0a]">
        {/* chat panel */}
         <ChatPanel
          messages={messages}
          isGenerating={isGenerating}
          isImproving={false}
          statusLog={statusLog}
          credits={credits}
          initialPrompt={initialPrompt}
          onGenerate={handleGenerate}
          userId={userId}
          workspaceId={workspaceId}
          appTitle={"Text App Title"}
        />

        {/* Editor Panel */}
        <CodePanel
        fileData={fileData}
        isGenerating={isGenerating}
        statusLog={statusLog}
        onFilePatch={handleFilePatch}
        />
    </div>
  )
}

export default WorkspaceClient
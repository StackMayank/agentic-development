"use client";
import { CodePanel } from "./Codepanel";
import { useCallback, useEffect, useRef, useState } from "react";
import { FileData, Message, StatusStep, WorkspaceData } from "@/types/workspace";
import ChatPanel from "./ChatPanel";
import { MIN_CREDITS_TO_GENERATE } from "@/lib/constants";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { creditsStore } from "@/lib/useLiveCredits";

interface WorkspaceClientProps {
  initialPrompt: string | null;
  userCredits: number;
  userId: string;
  userPlan: string;
  workspace: WorkspaceData | null;
}

const WorkspaceClient = ({
  initialPrompt,
  userCredits,
  userId,
  workspace,
  userPlan
}: WorkspaceClientProps) => {

  const [fileData, setFileData] = useState<FileData | null>(parseFileData(workspace?.fileData));
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusLog, setStatusLog] = useState<StatusStep[]>([]);
  const [credits, setCredits] = useState(userCredits);

  // Sync the local credits state into the shared store so Header + Chat read
  // the EXACT same live value after SSE updates. Initial SSR props hydrate
  // both places; SSE setCredits writes to both.
  useEffect(() => {
    creditsStore.setCredits(
      credits,
      (userPlan as "free" | "pro" | "starter") ?? undefined,
    );
  }, [credits, userPlan]);
   const [workspaceId, setWorkspaceId] = useState<string | null>(
    workspace?.id ?? null
  );
   const [messages, setMessages] = useState<Message[]>(
    parseMessages(workspace?.messages)
   );
    
    const [isImproving, setIsImproving] = useState(false);

    const router = useRouter();

  // Refs to avoid stale closures in callbacks
  const messagesRef = useRef<Message[]>(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const workspaceIdRef = useRef<string | null>(workspaceId);
  useEffect(() => {
    workspaceIdRef.current = workspaceId;
  }, [workspaceId]);

  // fileData ref — so handleImprove never closes over stale fileData
  // even as file_patch events stream in
  const fileDataRef = useRef<FileData | null>(fileData);
  useEffect(() => {
    fileDataRef.current = fileData;
  }, [fileData]);
  
   const completeSteps = () => {
    setStatusLog((prev) =>
      prev.map((s, i) =>
        i === prev.length - 1 ? { ...s, status: "done" as const } : s
      )
    );
  };

         // AbortController refs — used to cancel in-flight streams
  const generateAbortRef = useRef<AbortController | null>(null);
  const improveAbortRef = useRef<AbortController | null>(null);


  const handleFilePatch = useCallback((patches: FileData) => {
    setFileData(patches);
  }, []);

    const pushStep = (label: string) => {
    setStatusLog((prev) => [
      ...prev.map((s, i) =>
        i === prev.length - 1 ? { ...s, status: "done" as const } : s
      ),
      { label, status: "running" as const },
    ]);
  };

  function parseMessages(raw: unknown): Message[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (m): m is Message =>
      typeof m === "object" && m !== null && "role" in m && "content" in m
  );
}

function parseFileData(raw: unknown): FileData | null {
  if (!raw || typeof raw !== "object") return null;
  const f = raw as Record<string, unknown>;
  if (!f.files || !f.dependencies) return null;
  return raw as FileData;
}

  const handleImprove = useCallback(
    async (userRequest: string) => {
      if (isGenerating || isImproving) return;
      if (credits < MIN_CREDITS_TO_GENERATE) return;
      if (!workspaceIdRef.current) return;

      const currentFileData = fileDataRef.current;
      if (!currentFileData) return;

      const abortController = new AbortController();
      improveAbortRef.current = abortController;

      setIsImproving(true);
      setMessages((prev) => [
        ...prev,
        { role: "user", content: userRequest },
        { role: "assistant", content: "" },
      ]);

      try {
        const res = await fetch("/api/improve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abortController.signal,
          body: JSON.stringify({
            userId,
            workspaceId: workspaceIdRef.current,
            userRequest,
            fileData: currentFileData,
          }),
        });

        if (res.status === 403) {
          toast.error("Upgrade to Starter or Pro to use Improve with Forge Agent.");
          setMessages((prev) => prev.slice(0, -2));
          return;
        }
        if (res.status === 402) {
          toast.error("Not enough credits.");
          setMessages((prev) => prev.slice(0, -2));
          return;
        }
        if (!res.ok || !res.body) throw new Error("Improve failed");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        const localPatches: Record<string, { code: string }> = {};
        let buffer = "";
        let accumulatedThinking = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;

            let event: Record<string, unknown>;
            try {
              event = JSON.parse(line.slice(6));
            } catch {
              continue;
            }

            if (event.type === "thinking" && typeof event.text === "string") {
              accumulatedThinking += event.text;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: accumulatedThinking,
                };
                return updated;
              });
            } else if (
              event.type === "file_patch" &&
              typeof event.path === "string" &&
              typeof event.code === "string"
            ) {
              localPatches[event.path] = { code: event.code };
            } else if (event.type === "done") {
              setFileData(event.fileData as FileData);
              setCredits(event.creditsRemaining as number);
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: event.summary as string,
                };
                return updated;
              });
            } else if (event.type === "error") {
              throw new Error(String(event.message));
            }
          }
        }
      } catch (error) {
        if (error instanceof Error && error.message === "Improve failed") {
          setMessages((prev) => prev.slice(0, -2));
        }
      } finally {
        improveAbortRef.current = null;
        setIsImproving(false);
      }
    },
    [credits, isGenerating, isImproving, userId],
  );

  const handleGenerate = useCallback(
    async (prompt: string, imageUrl?: string) => {
      if(isGenerating) return;
      if(credits < MIN_CREDITS_TO_GENERATE) return

        const userMessage: Message = {
        role: "user",
        content: prompt,
        ...(imageUrl ? { imageUrl } : {}),
      };

      const currentMessages = messagesRef.current;
      const currentWorkspaceId = workspaceIdRef.current;

      setMessages((prev) => [...prev, userMessage]);
      setIsGenerating(true);
      setStatusLog([{ label: "Thinking…", status: "running" }]);
      
      // Create a fresh AbortController for this request
      const abortController = new AbortController();
      generateAbortRef.current = abortController;

      try {
        const conversationHistory = [...currentMessages, userMessage];

        const res = await fetch("/api/gen-ai-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abortController.signal,
          body: JSON.stringify({
            workspaceId: currentWorkspaceId,
            messages: conversationHistory,
            fileData: fileDataRef.current,
          }),
        });

        if (res.status === 402) {
          toast.error("Not  enough credits");
          setMessages((prev) => prev.slice(0, -1));
          return;
        }
        if (res.status === 429) {
          toast.error("Too many requests. Please slow down.");
          setMessages((prev) => prev.slice(0, -1));
          return;
        }
        if (!res.ok || !res.body) throw new Error("Generation failed");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const event = JSON.parse(line.slice(6));
              if (event.type === "status") {
                pushStep(event.message);
              } else if (event.type === "done") {
                completeSteps();
                setWorkspaceId(event.workspaceId);
                setFileData(event.fileData);
                setCredits(event.creditsRemaining);
                router.refresh();
                setMessages((prev) => [
                  ...prev,
                  { role: "assistant", content: event.assistantMessage },
                ]);
                window.history.replaceState(
                  null,
                  "",
                  `/workspace?id=${event.workspaceId}`
                );
              } else if (event.type === "error") {
                throw new Error(event.message);
              }
            } catch (error) {
              // skip malformed SSE lines
            }
          }
        }
      } catch (err) {
        // User-initiated stop — silently roll back the user message
        if (err instanceof Error && err.name === "AbortError") {
          setMessages((prev) => prev.slice(0, -1));
          return;
        }
        toast.error(
          err instanceof Error ? err.message : "Something went wrong."
        );
        setMessages((prev) => prev.slice(0, -1));
      } finally {
        generateAbortRef.current = null;
        setIsGenerating(false);
        setStatusLog([]);
      }
    },
    [credits, isGenerating, userId],
  );

  // Cancel whichever stream is currently in-flight
  const handleStop = useCallback(() => {
    generateAbortRef.current?.abort();
    improveAbortRef.current?.abort();
  }, []);


  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-[#0a0a0a]">
      {/* chat panel */}
      <ChatPanel
        messages={messages}
        isGenerating={isGenerating}
        isImproving={isImproving}
        statusLog={statusLog}
        credits={credits}
        initialPrompt={initialPrompt}
        onStop={handleStop}
        onGenerate={handleGenerate}
        userId={userId}
        workspaceId={workspaceId}
        appTitle={fileData?.title ?? workspace?.title ?? null}
      />

      {/* Editor Panel */}
      <CodePanel
        isImproving={isImproving}
        fileData={fileData}
        isGenerating={isGenerating}
        statusLog={statusLog}
        onFilePatch={handleFilePatch}
        onFixError={(error) =>
          handleGenerate(
            `There is an error in the preview:\n\n\`\`\`\n${error}\n\`\`\`\n\nPlease fix it.`,
          )
        }
        appTitle={fileData?.title ?? workspace?.title ?? null}
        isProUser={userPlan === "pro"}
        onImprove={handleImprove}
      />
    </div>
  );
};

export default WorkspaceClient;

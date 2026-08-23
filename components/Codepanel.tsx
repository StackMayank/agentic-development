"use client";
import { useState } from "react";
import { FileData, StatusStep } from "@/types/workspace";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  SandpackFileExplorer,
  useSandpack,
} from "@codesandbox/sandpack-react";
import { dracula } from "@codesandbox/sandpack-themes";
import { useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Code2, Eye, Wand2, RotateCw } from "lucide-react";
import {RingLoader} from "react-spinners"
import { Button } from "./ui/button";
import {Bot, Download, Loader2, ArrowUp } from "lucide-react";
import PricingModal from "@/components/PricingModal"
import { cn } from "@/lib/utils";
import JSZip from "jszip";


// ─── Placeholder ──────────────────────────────────────────────────────────────

const PLACEHOLDER_FILES = {
  "/App.js": {
    code: `export default function App() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "system-ui, sans-serif",
    }}>
      <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)" }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚡</div>
        <p style={{ fontSize: 14 }}>Your app will appear here</p>
      </div>
    </div>
  );
}`,
  },
};

// ─── Base dependencies ────────────────────────────────────────────────────────

const BASE_DEPENDENCIES: Record<string, string> = {
  "react-is": "latest",
  "react-router-dom": "latest",
  "lucide-react": "latest",
  recharts: "latest",
  "date-fns": "latest",
  "framer-motion": "latest",
  "react-hook-form": "latest",
  "@hookform/resolvers": "latest",
  zod: "latest",
  "@radix-ui/react-dialog": "latest",
  "@radix-ui/react-dropdown-menu": "latest",
  "@radix-ui/react-tabs": "latest",
  "@radix-ui/react-tooltip": "latest",
  "@radix-ui/react-accordion": "latest",
  "@radix-ui/react-select": "latest",
  axios: "latest",
  clsx: "latest",
  "class-variance-authority": "latest",
  "tailwind-merge": "latest",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type ActiveTab = "preview" | "code";

interface codePanelProps {
  fileData: FileData | null;
  isGenerating: boolean;
  statusLog: StatusStep[];
  onFilePatch: (patches: FileData) => void;
  isImproving: boolean;
  onFixError: (error: string) => Promise<void>;
  isProUser: boolean;
  appTitle: string | null ;
  onImprove: (userRequest: string) => Promise<void>;
}

function SandpackInner({
  fileData,
  isGenerating,
  activeTab,
  setActiveTab,
  isImproving,
  statusLog,
  onFixError,
  isProUser,
  appTitle,
  onImprove,
}: {
  fileData: FileData | null;
  isGenerating: boolean;
  activeTab: ActiveTab;
  setActiveTab: (t: ActiveTab) => void;
  isImproving: boolean;
  statusLog: StatusStep[];
  onFixError: (error : string) => Promise<void>;
  isProUser: boolean;
  appTitle: string | null ;
  onImprove: (userRequest: string) => Promise<void>;
  
  // TODO : statusLog, onImprove, onFixError, appTitle, isImproving, isProUser
}) {
  const { sandpack, listen } = useSandpack();
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
    const [improveInput, setImproveInput] = useState("");
  const [showImproveInput, setShowImproveInput] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleImproveSubmit = async () => {
    const trimmed = improveInput.trim();
    if (!trimmed || isImproving) return;
    setImproveInput("");
    setShowImproveInput(false);
    await onImprove(trimmed);
  };

  const handleExportZip = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const filesToZip =
        Object.keys(sandpack.files).length > 0
          ? sandpack.files
          : fileData?.files ?? {};

      const dependencies = {
        ...BASE_DEPENDENCIES,
        ...(fileData?.dependencies ?? {}),
      };

      const zip = new JSZip();

      const packageJson = {
        name: appTitle ?? "forge-app",
        version: "1.0.0",
        private: true,
        dependencies: {
          react: "^18.2.0",
          "react-dom": "^18.2.0",
          "react-scripts": "5.0.1",
          ...dependencies,
        },
        scripts: {
          start: "react-scripts start",
          build: "react-scripts build",
        },
        browserslist: {
          production: [">0.2%", "not dead", "not op_mini all"],
          development: ["last 1 chrome version"],
        },
      };
      zip.file("package.json", JSON.stringify(packageJson, null, 2));

      zip.file(
        "public/index.html",
        `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Forge App</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`
      );

      for (const [filePath, fileObj] of Object.entries(filesToZip)) {
        const code =
          typeof fileObj === "object" && fileObj !== null && "code" in fileObj
            ? (fileObj as { code: string }).code
            : "";
        const zipPath = filePath.startsWith("/")
          ? `src${filePath}`
          : `src/${filePath}`;
        zip.file(zipPath, code);
      }

      zip.file(
        "src/index.js",
        `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);`
      );

      zip.file(
        "README.md",
        `# Forge App\n\nGenerated with [Forge](https://forge.app).\n\n## Getting started\n\n\`\`\`bash\nnpm install\nnpm start\n\`\`\``
      );

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const zipName = appTitle
        ? `${appTitle
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")}.zip`
        : "praxis-app.zip";
      a.download = zipName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };


  useEffect(() => {
    unsubscribeRef.current = listen((msg) => {
      if(
        msg.type === "action" &&
        "action" in msg && 
        msg.action === "show-error"
      ){
       const errMsg = 
       "message" in msg && typeof msg.message === "string" 
       ?  msg.message
       : "An error occurred in the preview"; 
       setPreviewError(errMsg);
       return;
      }

      if(msg.type === "compile" && "error" in msg){
        const errMsg =
        "message" in msg && typeof msg.message === "string"
        ? msg.message 
        : "compile error in preview"
        setPreviewError(errMsg)
        return;
      }

      if(msg.type ==="success"){
        setPreviewError(null);
      }
    });

    return () => unsubscribeRef.current?.();
  }, [listen])

  useEffect(() => {
    if(isGenerating) setPreviewError(null);
  }, [isGenerating])

  const prevFilesRef = useRef<Record<string, { code: string }>>({});
  
  useEffect(() => {
    if (!fileData?.files) return;
    const prev = prevFilesRef.current;

    for (const [path, { code }] of Object.entries(fileData.files)) {
      if (prev[path]?.code !== code) {
        sandpack.updateFile(path, code);
      }
    }

    prevFilesRef.current = fileData.files;
  }, [fileData?.files]);

    useEffect(() => {
      if(fileData) setActiveTab("preview");

    }, [fileData])


  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as ActiveTab)}
      className="flex h-full flex-col gap-0"
    >
      <div className="flex items-center justify-between border-b border-white/6 px-2">
        <TabsList
          variant="line"
          className="h-auto gap-0 rounded-none bg-transparent p-0"
        >
          <TabsTrigger className="border-b-2 pt-2" value="code">
            <Code2 className="h-3.5 w-3.5" />
            Code
          </TabsTrigger>

          <TabsTrigger className="border-b-2" value="preview">
            <Eye className="h-3.5 w-3.5" />
            Preview
          </TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-1.5">
          {/* ── Improve button ── */}
          {isProUser ? (
            showImproveInput ? (
              <div className="flex items-center gap-1.5">
                <div className="relative flex items-center">
                  <Bot className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-violet-400" />
                  <input
                    autoFocus
                    value={improveInput}
                    onChange={(e) => setImproveInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleImproveSubmit();
                      if (e.key === "Escape") setShowImproveInput(false);
                    }}
                    placeholder="What should I improve?"
                    className="h-7 w-56 rounded-md border border-violet-500/30 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-cyan-500/10 pl-8 pr-3 text-xs text-white/80 placeholder:text-white/30 focus:border-violet-400/50 focus:outline-none focus:shadow-[0_0_10px_rgba(139,92,246,0.2)]"
                  />
                </div>
                <button
                  onClick={handleImproveSubmit}
                  disabled={!improveInput.trim() || isImproving}
                  className="group relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-md border border-violet-500/30 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 text-violet-300 transition-all duration-200 hover:border-violet-400/50 hover:from-violet-500/30 hover:to-fuchsia-500/30 hover:shadow-[0_0_10px_rgba(139,92,246,0.3)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isImproving ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <ArrowUp className="h-3 w-3" />
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowImproveInput(true)}
                disabled={isImproving || !fileData}
                className="group relative flex h-7 cursor-pointer items-center gap-1.5 overflow-hidden rounded-md border border-white/10 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-cyan-500/10 px-2.5 text-xs font-medium transition-all duration-300 hover:border-white/20 hover:from-violet-500/20 hover:via-fuchsia-500/20 hover:to-cyan-500/20 hover:shadow-[0_0_12px_rgba(139,92,246,0.3)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_2.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                {isImproving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-400" />
                ) : (
                  <Bot className="h-3.5 w-3.5 text-violet-400 transition-colors group-hover:text-violet-300" />
                )}
                <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                  {isImproving ? "Improving…" : "Improve with Agent"}
                </span>
                {!isImproving && (
                  <span className="rounded-sm bg-violet-500/30 px-1 py-0.5 text-[10px] font-semibold leading-none text-violet-300">
                    PRO
                  </span>
                )}
              </button>
            )
          ) : (
            <PricingModal reason="upgrade">
              <span className="group relative flex h-7 cursor-pointer items-center gap-1.5 overflow-hidden rounded-md border border-white/10 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-cyan-500/10 px-2.5 text-xs font-medium text-white/60 transition-all duration-300 hover:border-white/20 hover:from-violet-500/20 hover:via-fuchsia-500/20 hover:to-cyan-500/20 hover:text-white/90 hover:shadow-[0_0_12px_rgba(139,92,246,0.3)]">
                <span className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_2.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <Bot className="h-3.5 w-3.5 text-violet-400 transition-colors group-hover:text-violet-300" />
                <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                  Improve with Agent
                </span>
                <span className="rounded-sm bg-violet-500/30 px-1 py-0.5 text-[10px] font-semibold leading-none text-violet-300">
                  PRO
                </span>
              </span>
            </PricingModal>
          )}

          <Button
            variant="ghost"
            onClick={handleExportZip}
            disabled={isExporting || !fileData}
          >
            {isExporting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            Download
          </Button>
        </div>


      </div>

      <div className="relative flex h-full min-h-0 w-full flex-1 overflow-hidden">
        {(isGenerating || isImproving) && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-[#0a0a0a]/90 backdrop-blur-md">
            <RingLoader color="#60a5fa" size={72} speedMultiplier={0.75} />
            <div className="flex flex-col items-center gap-1.5">
              <p className="text-sm font-medium text-white/70">
                {isImproving
                ? "Improving with Cline AI Agent..."
                : (statusLog[statusLog.length - 1]?.label ?? "Generating...")
                }
              </p>
              <p className="text-xs text-white/30">
                This usually takes 10-20 seconds
              </p>
            </div>
          </div>
        )}

        <div className="relative flex h-full w-full flex-1 overflow-hidden">
        <SandpackLayout
          style={{
            width: "100%",
            height: "100%",
            minHeight: 0,
            flex: 1,
            border: "none",
            borderRadius: 0,
            background: "transparent",
          }}
          className="h-full w-full"
        >
          <TabsContent
          value="preview"
          forceMount
          className="relative mt-0 h-full min-h-0 w-full data-[state=inactive]:hidden"
          >
            {/* Single reload button at BOTTOM-right of preview area */}
            {sandpack.status !== "idle" && (
              <div className="pointer-events-none absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 justify-center">
                <button
                  onClick={() => sandpack.runSandpack()}
                  className="pointer-events-auto group inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/15 bg-[#0d0d0d]/80 px-3 text-xs font-medium text-white/80 shadow-md backdrop-blur transition-all hover:border-white/25 hover:bg-white/10 hover:text-white active:scale-95"
                  title="Reload preview"
                >
                  <RotateCw
                    className={cn(
                      "h-3.5 w-3.5 transition-transform group-hover:rotate-180",
                      sandpack.status === "running" && "animate-spin",
                    )}
                  />
                  Reload
                </button>
              </div>
            )}
            <SandpackPreview
            style={{ width: "100%", height: "100%", minHeight: 0 }}
            className="h-full w-full"
            showOpenInCodeSandbox={false}
            showRefreshButton={false}
            showNavigator={false}
            />

          </TabsContent>

          <TabsContent
          value="code"
          forceMount
          className="mt-0 flex h-full min-h-0 w-full data-[state=inactive]:hidden"
          >
             <SandpackFileExplorer
              style={{
                height: "100%",
                minHeight: 0,
                width: "180px",
                borderRight: "0.5px solid rgba(255,255,255,0.08)",
              }}
            />
            <SandpackCodeEditor
              style={{ height: "100%", minHeight: 0, flex: 1 }}
              showTabs
              showLineNumbers
              showInlineErrors
              closableTabs
              readOnly
            />
        </TabsContent>
        </SandpackLayout>
         </div>
      </div>
      {previewError && !isGenerating && !isImproving && activeTab === "preview" && (
          <div className="absolute inset-x-0 bottom-3 z-20 border-t border-red-500/20 bg-red-950/99 p-4 pb-6">
              <div className="flex items-center gap-2.5">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400/70" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-400/80">Preview error</p>
                <p className="break-all text-[11px] text-red-300/50">{previewError}
                </p>
              </div>

              <Button
              onClick={() => onFixError(previewError)}
              variant="destructive"
              size="sm"
              >
                <Wand2 className="h-3 w-3"  />
                Fix with AI
              </Button>
              </div>
          </div>
         )}
    </Tabs>
  );
}



export function CodePanel({
  fileData,
  isGenerating,
  statusLog,
  onFilePatch: _onFilePatch,
  isImproving,
  onFixError,
  isProUser,
  appTitle,
  onImprove
}: codePanelProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("preview");

  const files = fileData?.files ?? PLACEHOLDER_FILES;

  const dependencies = {
    ...BASE_DEPENDENCIES,
    ...(fileData?.dependencies ?? {}),
  };

  const filePathKey = Object.keys(files).sort().join("|");

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
      <SandpackProvider
        key={filePathKey}
        template="react"
        theme={dracula}
        files={files}
        customSetup={{ dependencies }}
        style={{ height: "100%", width: "100%", minHeight: 0 }}
        className="h-full w-full min-h-0 flex-1"
        options={{
          externalResources: ["https://cdn.tailwindcss.com"],
          recompileMode: "delayed",
          recompileDelay: 500,
        }}
      >
        <SandpackInner
         isImproving={isImproving}
          statusLog={statusLog}
          fileData={fileData}
          isGenerating={isGenerating}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onFixError={onFixError}
          isProUser={isProUser}
          appTitle={appTitle}
          onImprove={onImprove}
        />
      </SandpackProvider>
    </div>
  );
}

import WorkspaceClient from "@/components/WorkspaceClient";
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation";

interface WorkspacePageProps {
    searchParams: Promise<{ prompt? : string; id?: string }>;
}

const WorkSpace = async ({searchParams}: WorkspacePageProps) => {
    const { userId } = await auth();
    if(!userId) redirect("/")

    const { prompt , id } = await searchParams ;
    
  return (
    <WorkspaceClient  
    initialPrompt= {prompt ?? null} 
    userCredits={10} // placeholder until DB reads in step 8
    userId={userId}
    userPlan="free" // placeholder until DB read in step 8
    />
  )
}

export default WorkSpace;
import { getWorkspaceById, getWorkspaceUser } from "@/actions/workspace";
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
    
    const user = await getWorkspaceUser()

    let workspace = null;
    if (id) {
      workspace = await getWorkspaceById(id, user.id)
    }

  return (
    <WorkspaceClient  
    initialPrompt= {prompt ?? null} 
    userCredits={user.credits} // placeholder until DB reads in step 8
    userId={user.id}
    userPlan={user.plan} // placeholder until DB read in step 8
    workspace={workspace}
    />
  )
}

export default WorkSpace;
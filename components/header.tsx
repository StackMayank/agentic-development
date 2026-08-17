import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Zap } from "lucide-react"
import { Show } from "@clerk/nextjs"
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs"
import { Button } from "./ui/button"


const Header = () => {
  return (
    <header className="fixed top-0 left-0 z-50 h-16 border-b border-white/6 bg-white/7 backdrop-blur-md w-full ">

        <nav className="mx-auto flex h-full max-w-7xl 
        items-center justify-between px-4 sm:px-6"> 

        {/* Image Logo */}

        <Link href="/">
            <Image 
            src={"/logo-white.png"}
            alt="Praxis Logo"
            width={100}
            height={100}  
            className="h-12 w-auto rounded-md"      
            />
        </Link>

        {/* Navigation Links */}

        <div className="flex items-center gap-5">

        <Show when="signed-in">
                <Link
           href={"/projects"}
           className="text-[13px] font-medium text-white/40 transition-colors hover:text-white/80 cursor-pointer"
           >
            Projects
           </Link> 
        

        {/* credits */}

        <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 text-xs text-white/70">
            <Zap className="h-3 w-3 fill-white/70"/>
            3 / 40 credits
        </span>  
              <UserButton />
            </Show>


        <Show when="signed-out">
              <SignInButton mode="modal" >
                <Button variant={"ghost"} className={"text-white/60 hover:text-white/90"} >
                    Log in
                </Button>
                </SignInButton>
               
               

              <SignUpButton mode="modal">
                <Button className={"h-8 rounded-sm font-semibold active:scale-95 px-4"} >
                  Get Started
                  <ArrowRight className="h-3 w-3 opacity-60"/>
                </Button>
              </SignUpButton>
            </Show>
            

        </div>

        </nav>
    </header>
  )
}


export default Header
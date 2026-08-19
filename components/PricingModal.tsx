import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { PricingTable } from "@clerk/nextjs";

interface PricingModalProps {
  children: React.ReactNode;
  reason?: "credits" | "upgrade";
}

const PricingModal = ({
  children,
  reason = "upgrade",
}: PricingModalProps) => {
  const title =
    reason === "credits" ? "You're out of credits" : "Upgrade your plan";
  const description =
    reason === "credits"
      ? "You've used all your credits. Upgrade to Keep building."
      : "Choose a plan that fits how much you build.";

  return (
    <Dialog>
      <DialogTrigger className="cursor-pointer" asChild>
        {children}
      </DialogTrigger>
      <DialogContent className=" border-white/8 bg-black p-5 text-white sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl lg:text-3xl  mx-auto font-bold text-white">
            {title}
          </DialogTitle>
          <DialogDescription className="text-white/60 mx-auto text-lg mt-2">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <PricingTable />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PricingModal;

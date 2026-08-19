import {
  Sparkles,
  Zap,
  Code2,
  Eye,
  Package,
  ImageIcon,
  ShieldCheck,
} from "lucide-react";

export const SUGGESTIONS = [
  "A Spotify stats dashboard with charts",
  "A kanban board with drag and drop",
  "A weather app with animated icons",
  "A personal finance tracker",
  "A recipe finder with filters",
  "A pomodoro timer with tasks",
];

export const FEATURES = [
  {
    icon: Zap,
    label: "Instant generation",
    desc: "Describe your app in plain English. Gemini 3.5 Flash returns production-ready React + Tailwind code in seconds.",
  },
  {
    icon: Eye,
    label: "Live preview",
    desc: "Your app renders instantly in the browser via Sandpack. No install, no build step — just a working preview.",
  },
  {
    icon: Code2,
    label: "Full source code",
    desc: "Browse every generated file. Edit directly in the built-in editor and watch the preview update in real time.",
  },
  {
    icon: Package,
    label: "Smart packages",
    desc: "AI picks the right npm packages. We validate them against the npm registry and filter hallucinated ones silently.",
  },
  {
    icon: Sparkles,
    label: "AI error recovery",
    desc: "When your preview throws an error, a banner appears. One click sends the error to AI and auto-fixes the code.",
  },
  {
    icon: ImageIcon,
    label: "Image-aware prompts",
    desc: "Attach screenshots or mockups to your prompt. The AI reads them and generates code that matches your design.",
  },
];

export const STEPS = [
  {
    number: "01",
    label: "Describe your app",
    desc: "Type a prompt or pick a suggestion. Add screenshots for extra context.",
  },
  {
    number: "02",
    label: "AI generates code",
    desc: "Gemini writes React + Tailwind components, picks dependencies, and structures your files.",
  },
  {
    number: "03",
    label: "Preview & refine",
    desc: "See your app live instantly. Keep chatting to iterate — AI remembers the full conversation.",
  },
  {
    number: "04",
    label: "Export and deploy",
    desc: "Open in CodeSandbox, copy the source, and deploy to a live URL.",
  },
];

export const PLACEHOLDERS = [
  "A task manager with priority labels and drag-and-drop…",
  "A crypto portfolio tracker with live charts…",
  "A markdown notes app with live preview…",
  "An expense tracker with monthly breakdowns…",
  "A habit tracker with streaks and heatmaps…",
];

export interface PricingPlanData {
  name: string;
  icon: typeof Zap;
  iconColor: string;
  description: string;
  price: number | string;
  billingPeriod?: string;
  priceNote?: string;
  cta: {
    label: string;
    href?: string;
    variant?: "default" | "outline" | "secondary";
  };
  features: string[];
  featured?: boolean;
}

export const PRICING_HEADER = {
  badge: "Plans & Pricing",
  title: "Simple, transparent pricing",
  description:
    "Choose the plan that best fits your workflow. Upgrade or downgrade anytime.",
};

export const PRICING_PLANS: PricingPlanData[] = [
  {
    name: "Free",
    icon: Zap,
    iconColor: "text-emerald-400",
    description: "Perfect for testing ideas and exploring what you can build.",
    price: 0,
    billingPeriod: "/ month",
    priceNote: "Free forever. No credit card required.",
    cta: {
      label: "Get Started Free",
      variant: "outline",
    },
    features: [
      "10 generations / month",
      "Live interactive preview",
      "Export code to ZIP",
      "Basic AI component generation",
    ],
    featured: false,
  },
  {
    name: "Starter",
    icon: Sparkles,
    iconColor: "text-purple-400",
    description: "For creators and developers who build and iterate regularly.",
    price: 9,
    billingPeriod: "/ month",
    priceNote: "Billed monthly. Cancel anytime.",
    cta: {
      label: "Upgrade to Starter",
      variant: "default",
    },
    features: [
      "50 generations / month",
      "Image & screenshot uploads",
      "Live interactive preview",
      "Export code to ZIP",
      "Standard queue priority",
    ],
    featured: true,
  },
  {
    name: "Pro",
    icon: ShieldCheck,
    iconColor: "text-blue-400",
    description: "For power users and teams who need maximum speed & capacity.",
    price: 29,
    billingPeriod: "/ month",
    priceNote: "Billed monthly. Cancel anytime.",
    cta: {
      label: "Get Pro Access",
      variant: "outline",
    },
    features: [
      "150 generations / month",
      "Priority AI (fast response time)",
      "Access to Forge Pro Agent",
      "Image & screenshot uploads",
      "Live preview & ZIP export",
      "Dedicated support",
    ],
    featured: false,
  },
];
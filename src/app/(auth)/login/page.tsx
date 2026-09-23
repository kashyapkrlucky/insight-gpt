"use client";
import useAuthStore from "@/features/auth/store/useAuthStore";
import {
  APP_NAME,
  ASSISTANT_NAME,
  TEXT_ATLAS_ID_DESCRIPTION,
  TEXT_CONTINUE_AS_GUEST,
  TEXT_COPYRIGHT,
  TEXT_OR,
  TEXT_SIGN_IN_WITH_ATLAS_ID,
} from "@/shared/constants";
import { Button } from "@/shared/ui/Button";
import {
  CircleUserRoundIcon,
  FileSearchIcon,
  LogInIcon,
  QuoteIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";

const HIGHLIGHTS = [
  {
    icon: FileSearchIcon,
    title: "Ask in plain language",
    text: "Summaries, key points, or the one clause you need.",
  },
  {
    icon: QuoteIcon,
    title: "Grounded in your document",
    text: "Answers come from the PDF, not the internet.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Private by default",
    text: "Your files are only searchable by you.",
  },
];

function ChatPreview() {
  return (
    <div
      aria-hidden
      className="w-full max-w-md rounded-2xl border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur"
    >
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 text-xs text-white/70">
        <span className="size-2 rounded-full bg-emerald-400" />
        annual-report-2025.pdf
      </div>
      <div className="mt-4 ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-md bg-white/20 px-3.5 py-2 text-sm text-white">
        What were the main risks last year?
      </div>
      <div className="mt-4 flex gap-2.5">
        <Image
          src="/bot.jpg"
          alt=""
          width={28}
          height={28}
          className="size-7 shrink-0 rounded-full object-cover ring-1 ring-white/20"
        />
        <div className="space-y-1.5 text-sm leading-6 text-white/90">
          <p>The report highlights three main risks:</p>
          <ul className="list-disc space-y-0.5 pl-5 text-white/80">
            <li>Supply chain delays in Q2</li>
            <li>Rising interest rates</li>
            <li>Dependence on two key customers</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  const [isAtlasRedirecting, setIsAtlasRedirecting] = useState(false);
  const { onGuestLogin, isGuestLoading } = useAuthStore();
  const router = useRouter();

  const handleGuestLogin = async () => {
    const token = await onGuestLogin();
    if (token) {
      router.replace("/");
    } else {
      toast.error(
        useAuthStore.getState().error ||
          "Failed to login as guest. Please try again.",
      );
    }
  };

  const onAtlasLogin = () => {
    setIsAtlasRedirecting(true);
    window.location.href = `${process.env.NEXT_PUBLIC_AUTH_URL}/login?client_id=${process.env.NEXT_PUBLIC_CLIENT_ID}`;
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel */}
      <section className="relative hidden overflow-hidden bg-[#1e1b4b] lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,#6366f1_0%,transparent_55%),radial-gradient(ellipse_at_bottom_right,#7c3aed_0%,transparent_50%)] opacity-70"
        />
        <div className="relative flex items-center gap-3">
          <Image
            src="/logo.png"
            alt=""
            width={40}
            height={40}
            className="size-10 rounded-xl"
          />
          <span className="text-lg font-semibold text-white">{APP_NAME}</span>
        </div>

        <div className="relative space-y-10">
          <div className="max-w-lg">
            <h2 className="text-4xl leading-tight font-semibold tracking-tight text-balance text-white">
              Chat with any PDF.
              <br />
              Get answers you can trust.
            </h2>
            <p className="mt-4 text-base leading-7 text-white/70">
              Upload a document and ask {ASSISTANT_NAME} anything about it.
            </p>
          </div>
          <ChatPreview />
        </div>

        <p className="relative text-xs text-white/50">&copy; {TEXT_COPYRIGHT}</p>
      </section>

      {/* Sign-in panel */}
      <section className="flex flex-col items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <Image
              src="/logo.png"
              alt=""
              width={48}
              height={48}
              className="size-12 rounded-xl lg:hidden"
            />
            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-fg lg:mt-0">
              Sign in to {APP_NAME}
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted">
              Upload a PDF and start asking questions in seconds.
            </p>
          </div>

          <div className="mt-8 space-y-3">
            <Button
              fullWidth
              size="lg"
              disabled={isGuestLoading}
              loading={isAtlasRedirecting}
              onClick={onAtlasLogin}
              icon={<LogInIcon className="size-4" />}
            >
              {TEXT_SIGN_IN_WITH_ATLAS_ID}
            </Button>
            <p className="text-center text-xs leading-5 text-subtle">
              {TEXT_ATLAS_ID_DESCRIPTION}
            </p>

            <div className="flex items-center gap-3 py-1">
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs text-subtle uppercase">{TEXT_OR}</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <Button
              fullWidth
              size="lg"
              variant="outline"
              disabled={isAtlasRedirecting}
              loading={isGuestLoading}
              onClick={handleGuestLogin}
              icon={<CircleUserRoundIcon className="size-4" />}
            >
              {TEXT_CONTINUE_AS_GUEST}
            </Button>
          </div>

          <ul className="mt-10 space-y-4 border-t border-border pt-8 lg:hidden">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
                  <Icon className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-fg">{title}</p>
                  <p className="text-xs leading-5 text-muted">{text}</p>
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-10 text-center text-xs text-subtle lg:hidden">
            &copy; {TEXT_COPYRIGHT}
          </p>
        </div>
      </section>
    </div>
  );
}

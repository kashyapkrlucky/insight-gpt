"use client";
import useAuthStore from "@/features/auth/store/useAuthStore";
import {
  TEXT_ATLAS_ID_DESCRIPTION,
  TEXT_CONTINUE_AS_GUEST,
  TEXT_COPYRIGHT,
  TEXT_DESCRIPTION,
  TEXT_OR,
  TEXT_SIGN_IN_WITH_ATLAS_ID,
  TEXT_WELCOME_BACK,
} from "@/shared/constants";
import { Button } from "@/shared/ui/Button";
import { CircleUserRoundIcon, LogInIcon } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";

export default function Login() {
  const [isAtlasRedirecting, setIsAtlasRedirecting] = useState(false);

  const {
    onGuestLogin,
    isGuestLoading,
  } = useAuthStore();
  const router = useRouter();

  const handleGuestLogin = async () => {
    const token = await onGuestLogin();
    if (token) {
      router.push("/");
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
    <div className="flex w-full max-w-md flex-col items-center gap-8 rounded-md border border-neutral-200 bg-white p-8 text-center shadow-sm">
      <div className="flex flex-col items-center gap-3">
        <Image
          src="/logo.png"
          alt="Logo"
          width={64}
          height={64}
          className="h-14 w-14 rounded-md"
        />
        <h1 className="text-2xl font-semibold text-neutral-950">
          {TEXT_WELCOME_BACK}
        </h1>
        <p className="max-w-sm text-sm leading-6 text-neutral-500">
          {TEXT_DESCRIPTION}
        </p>
      </div>

      <div className="flex w-full flex-col gap-3">
        <Button
          disabled={isGuestLoading}
          loading={isAtlasRedirecting}
          onClick={onAtlasLogin}
        >
          <span className="flex items-center justify-center gap-2">
            <LogInIcon />
            {TEXT_SIGN_IN_WITH_ATLAS_ID}
          </span>
        </Button>
        <p className="text-xs leading-5 text-neutral-500">
          {TEXT_ATLAS_ID_DESCRIPTION}
        </p>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-neutral-200"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 font-medium text-neutral-400">
              {TEXT_OR}
            </span>
          </div>
        </div>

        <Button
          disabled={isAtlasRedirecting}
          loading={isGuestLoading}
          variant="outline"
          onClick={handleGuestLogin}
        >
          <span className="flex items-center justify-center gap-2">
            <CircleUserRoundIcon className="h-4 w-4" />
            {TEXT_CONTINUE_AS_GUEST}
          </span>
        </Button>
      </div>

      <div className="text-center">
        <p className="text-xs text-neutral-400">&copy;{TEXT_COPYRIGHT}</p>
      </div>
    </div>
  );
}

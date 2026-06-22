"use client";
import useAuthStore from "@/features/auth/store/useAuthStore";
import {
  // TEXT_AND,
  TEXT_ATLAS_ID_DESCRIPTION,
  // TEXT_BY_CONTINUING,
  TEXT_CONTINUE_AS_GUEST,
  TEXT_COPYRIGHT,
  TEXT_DESCRIPTION,
  TEXT_OR,
  // TEXT_PRIVACY,
  TEXT_SIGN_IN_WITH_ATLAS_ID,
  // TEXT_TERMS,
  TEXT_WELCOME_BACK,
} from "@/shared/constants";
import { Button } from "@/shared/ui/Button";
// import PageLink from "@/shared/ui/PageLink";
import PageLoader from "@/shared/ui/PageLoader";
import { CircleUserRoundIcon, Loader2Icon, LogInIcon } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";

export default function Login() {
  const loading = false;
  const [isOAuthChecked] = useState(false);

  const {
    onGuestLogin,
    // isAuthenticated,
    isGuestLoading,
  } = useAuthStore();
  const router = useRouter();

  // useEffect(() => {
  //   if (isOAuthChecked && !isAuthenticated && !loading) {
  //     // navigate("/login");
  //   }
  // }, [isAuthenticated, loading, isOAuthChecked]);

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
    console.log("Atlas login");
    window.location.href = `${process.env.NEXT_PUBLIC_AUTH_URL}/login?client_id=${process.env.NEXT_PUBLIC_CLIENT_ID}`;
  };

  if (loading && !isOAuthChecked) {
    return <PageLoader />;
  }

  return (
    <div className="w-full max-w-md bg-white/95 backdrop-blur-sm p-8 rounded-2xl border border-slate-200/50 flex flex-col items-center text-center gap-8 transition-all duration-300 shadow">
      {/* Logo Section */}
      <div className="flex flex-col items-center gap-3">
        <Image
          src="/logo.png"
          alt="Logo"
          width={64}
          height={64}
          className="w-16 h-16 rounded-md"
        />
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {TEXT_WELCOME_BACK}
        </h1>
        <p className="text-sm text-slate-600">{TEXT_DESCRIPTION}</p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 w-full">
        <Button disabled={loading} onClick={onAtlasLogin}>
          <span className="flex items-center justify-center gap-2">
            <LogInIcon />
            {TEXT_SIGN_IN_WITH_ATLAS_ID}
          </span>
        </Button>
        <p className="text-xs text-slate-600">{TEXT_ATLAS_ID_DESCRIPTION}</p>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-200"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-500">{TEXT_OR}</span>
          </div>
        </div>

        <Button
          disabled={isGuestLoading}
          variant="outline"
          onClick={handleGuestLogin}
        >
          <span className="flex items-center justify-center gap-2">
            {isGuestLoading ? (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            ) : (
              <CircleUserRoundIcon className="w-4 h-4" />
            )}
            {TEXT_CONTINUE_AS_GUEST}
          </span>
        </Button>
      </div>

      {/* Terms and Conditions */}
      <div className="text-center space-y-1">
        {/* <p className="text-xs text-slate-500 leading-relaxed">
          {TEXT_BY_CONTINUING}
          <PageLink url="/terms" text={TEXT_TERMS} /> {TEXT_AND}
          <PageLink url="/privacy" text={TEXT_PRIVACY} />
        </p> */}
        <p className="text-xs text-slate-400">&copy;{TEXT_COPYRIGHT}</p>
      </div>
    </div>
  );
}

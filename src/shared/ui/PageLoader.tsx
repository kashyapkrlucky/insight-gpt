import Image from "next/image";
import { Spinner } from "./Spinner";

export default function PageLoader() {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-bg">
      <div className="flex flex-col items-center gap-4">
        <Image
          src="/logo.png"
          alt=""
          width={48}
          height={48}
          priority
          className="size-12 rounded-xl"
        />
        <Spinner className="size-5 text-muted" />
      </div>
    </div>
  );
}

import Uploader from "@/features/chats/components/Uploader";
import { ChatList } from "@/features/chats/components/ChatList";
import { APP_NAME, MAX_UPLOAD_BYTES } from "@/shared/constants";
import { formatBytes } from "@/shared/utils";
import { UserMenu } from "@/shared/ui/UserMenu";
import Image from "next/image";

export default function LeftSideBar() {
  return (
    <aside className="flex max-h-[45dvh] w-full shrink-0 flex-col border-b border-neutral-200 bg-white md:max-h-none md:w-[336px] md:border-b-0 md:border-r">
      <header className="flex items-center gap-3 border-b border-neutral-200 px-5 py-4">
        <Image
          src="/logo.png"
          alt="Logo"
          width={48}
          height={48}
          className="h-10 w-10 rounded-md"
        />

        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold text-neutral-950">
            {APP_NAME}
          </h1>
          <p className="truncate text-xs leading-5 text-neutral-500">
            AI-powered PDF analysis and insights
          </p>
        </div>
      </header>

      <section className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              File
            </p>
            <h2 className="mt-1 text-sm font-medium text-neutral-950">
              PDF workspace
            </h2>
          </div>
          <span className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1 text-xs font-medium text-neutral-500">
            {formatBytes(MAX_UPLOAD_BYTES)} max
          </span>
        </div>
        <Uploader />
        <div className="flex min-h-0 flex-1 flex-col gap-3 border-t border-neutral-200 pt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Recent Chats
          </h3>
          <ChatList />
        </div>
      </section>
      <footer className="border-t border-neutral-200 px-5 py-3">
        <UserMenu />
      </footer>
    </aside>
  );
}

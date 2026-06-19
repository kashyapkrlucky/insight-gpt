import Uploader from "@/features/home/components/Uploader";
import { ChatList } from "@/features/chats/components/ChatList";
import { APP_NAME, MAX_UPLOAD_BYTES } from "@/shared/constants";
import { formatBytes } from "@/shared/utils";
import { UserMenu } from "@/shared/ui/UserMenu";

export default function LeftSideBar() {
  return (
    <aside className="w-[320px] border-r border-neutral-200 bg-white p-5 flex flex-col gap-4">
      <header className="flex items-center gap-3 px-1">
        <div className="w-12 h-12 flex items-center justify-center rounded-md bg-neutral-950 text-xs font-bold text-white">
          IGPT
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold tracking-tight">
            {APP_NAME}
          </h1>
          <p className="truncate text-xs text-neutral-500">
            AI-powered PDF analysis and insights
          </p>
        </div>
      </header>

      <section className="flex-1 border-b border-neutral-200 pb-4">
        <div className="flex items-start justify-between gap-3 px-1">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-400">
              File
            </p>
            <h2 className="mt-1 text-sm font-semibold text-neutral-950">
              Pdf only
            </h2>
          </div>
          <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-medium text-neutral-500">
            {formatBytes(MAX_UPLOAD_BYTES)} max
          </span>
        </div>
      <Uploader />
      <h3 className=" border-t border-neutral-200 pt-4 px-1 text-xs font-medium uppercase tracking-wider text-neutral-600">
        Recent Chats
      </h3>
      <ChatList />
      </section>
      <footer className="border-t border-gray-300">
        <UserMenu />
      </footer>
    </aside>
  );
}

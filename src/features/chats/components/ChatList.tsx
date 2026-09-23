"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileTextIcon, SearchIcon, Trash2Icon, XIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { displayTitle, groupChatsByDate } from "../utils/groupChats";
import type { Chat } from "../types";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { IconButton } from "@/shared/ui/Button";
import { Spinner } from "@/shared/ui/Spinner";
import { cn } from "@/shared/utils";

export function ChatList() {
  const {
    chats,
    currentChat,
    deleteChat,
    deletingChatId,
    isChatsLoading,
    hasLoadedChats,
  } = useChatStore();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Chat | null>(null);

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = needle
      ? chats.filter((chat) => chat.title.toLowerCase().includes(needle))
      : chats;
    return groupChatsByDate(filtered);
  }, [chats, query]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const wasCurrent = currentChat?.id === pendingDelete.id;
    const deleted = await deleteChat(pendingDelete.id);
    setPendingDelete(null);
    if (deleted && wasCurrent) router.push("/");
  };

  if (!hasLoadedChats && isChatsLoading) {
    return (
      <div className="space-y-1.5 px-1" aria-label="Loading chats">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-8 animate-pulse rounded-lg bg-surface-2"
            style={{ opacity: 1 - index * 0.15 }}
          />
        ))}
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="mx-1 rounded-xl border border-dashed border-border px-4 py-6 text-center">
        <FileTextIcon className="mx-auto size-5 text-subtle" />
        <p className="mt-2 text-xs leading-5 text-muted">
          No chats yet. Upload a PDF to start your first conversation.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="relative mb-3 px-1">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-3.5 -translate-y-1/2 text-subtle" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search chats"
          aria-label="Search chats"
          className="h-8 w-full rounded-lg border border-border bg-surface pr-8 pl-8 text-sm text-fg placeholder:text-subtle focus:border-border-strong focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <IconButton
            label="Clear search"
            size="sm"
            onClick={() => setQuery("")}
            className="absolute top-1/2 right-1.5 size-6 -translate-y-1/2"
          >
            <XIcon />
          </IconButton>
        )}
      </div>

      {groups.length === 0 ? (
        <p className="px-3 py-4 text-center text-xs text-muted">
          No chats match “{query}”.
        </p>
      ) : (
        <nav aria-label="Chats" className="space-y-4">
          {groups.map((group) => (
            <section key={group.label}>
              <h3 className="px-3 pb-1 text-[11px] font-medium tracking-wide text-subtle uppercase">
                {group.label}
              </h3>
              <ul className="space-y-0.5">
                {group.chats.map((chat) => {
                  const isActive = currentChat?.id === chat.id;
                  const isDeleting = deletingChatId === chat.id;
                  return (
                    <li key={chat.id} className="group relative">
                      <Link
                        href={`/chat/${chat.id}`}
                        aria-current={isActive ? "page" : undefined}
                        title={chat.title}
                        className={cn(
                          "flex h-9 items-center gap-2.5 rounded-lg pr-9 pl-3 text-sm transition-colors",
                          isActive
                            ? "bg-surface-3 font-medium text-fg"
                            : "text-muted hover:bg-surface-2 hover:text-fg",
                          isDeleting && "pointer-events-none opacity-50",
                        )}
                      >
                        <FileTextIcon
                          className={cn(
                            "size-4 shrink-0",
                            isActive ? "text-accent" : "text-subtle",
                          )}
                        />
                        <span className="truncate">{displayTitle(chat.title)}</span>
                      </Link>
                      <div
                        className={cn(
                          "absolute top-1/2 right-1 -translate-y-1/2 transition-opacity",
                          isDeleting || isActive
                            ? "opacity-100"
                            : "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100",
                        )}
                      >
                        {isDeleting ? (
                          <span className="grid size-7 place-items-center">
                            <Spinner className="size-3.5 text-muted" />
                          </span>
                        ) : (
                          <IconButton
                            label={`Delete ${displayTitle(chat.title)}`}
                            size="sm"
                            tone="danger"
                            onClick={() => setPendingDelete(chat)}
                          >
                            <Trash2Icon />
                          </IconButton>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </nav>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this chat?"
        description={
          <>
            <span className="font-medium text-fg">
              {pendingDelete && displayTitle(pendingDelete.title)}
            </span>{" "}
            and its conversation will be permanently deleted, along with the
            uploaded PDF.
          </>
        }
        confirmLabel="Delete"
        tone="danger"
        loading={Boolean(deletingChatId)}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}

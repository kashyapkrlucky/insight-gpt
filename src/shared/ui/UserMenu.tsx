"use client";

import { useState, useRef, useEffect, useSyncExternalStore } from "react";
import { LogOut, ChevronUp } from "lucide-react";
import { UserInfo } from "./UserInfo";
import useAuthStore from "@/features/auth/store/useAuthStore";
import { useChatStore } from "@/features/chats/store/useChatStore";
import toast from "react-hot-toast";

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { setCurrentChat } = useChatStore();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isHydrated = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setCurrentChat(null);
    toast.success("Signed out.");
  };

  const userMenuButtonClasses =
    "group flex w-full items-center justify-between rounded-md px-2 py-2 transition hover:bg-neutral-50";
  const chevronClasses =
    "h-4 w-4 text-neutral-400 transition-transform duration-200 group-hover:text-neutral-700";
  const dropdownClasses =
    "absolute bottom-14 left-0 z-50 w-72 overflow-hidden rounded-md border border-neutral-200 bg-white shadow-lg";
  const userInfoHeaderClasses =
    "border-b border-neutral-200 bg-neutral-50 px-4 py-3";
  const menuItemsClasses = "py-2";
  const logoutButtonClasses =
    "flex w-full items-center px-4 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-red-50 hover:text-red-600";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={userMenuButtonClasses}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {isHydrated && user && <UserInfo showEmail={false} />}

        <ChevronUp
          className={`${chevronClasses} ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className={dropdownClasses}>
          {/* User Info Header */}
          <div className={userInfoHeaderClasses}>
            {isHydrated && user && <UserInfo />}
          </div>

          <div className={menuItemsClasses}>
            <button
              onClick={handleLogout}
              className={logoutButtonClasses}
              role="menuitem"
            >
              <LogOut className="mr-3 h-4 w-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

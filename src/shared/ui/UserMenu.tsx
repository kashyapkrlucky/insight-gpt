"use client";

import { useState, useRef, useEffect, useSyncExternalStore } from "react";
import { LogOut, ChevronUp } from "lucide-react";
import { UserInfo } from "./UserInfo";
import useAuthStore from "@/features/auth/store/useAuthStore";
import { useChatStore } from "@/features/chats/store/useChatStore";

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
    getServerSnapshot
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

  // Handler for logout
  const handleLogout = () => {
    logout();
    setCurrentChat(null);
  };

  // Classes for
  const userMenuButtonClasses =
    "w-full flex items-center justify-center md:justify-between rounded-lg transition-all duration-200 group hover:bg-white/[0.04] md:px-2 md:py-2";
  const chevronClasses =
    "hidden md:block w-4 h-4 text-slate-700 transition-transform duration-200 group-hover:text-slate-900";
  const dropdownClasses =
    "absolute bottom-14 left-0 w-64 rounded-lg border border-gray-300 bg-[var(--surface-elevated)] shadow-2xl shadow-black/40 backdrop-blur-xl z-50 overflow-hidden animate-in slide-in-from-bottom-2 fade-in-0 duration-200";
  const userInfoHeaderClasses =
    "px-4 py-3 bg-white/[0.035] border-b border-gray-300";
  const menuItemsClasses = "py-2";
  const logoutButtonClasses =
    "py-2 px-4 w-full flex items-center text-sm text-slate-800 hover:text-red-600 transition-colors font-medium";

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


          {/* Menu Items */}
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

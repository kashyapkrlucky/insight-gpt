import { useEffect } from "react";
interface UseClickOutsideProps {
  areaRef: React.RefObject<HTMLDivElement>;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}
export function useClickOutside({ areaRef, setIsOpen }: UseClickOutsideProps) {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (areaRef.current && !areaRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
}

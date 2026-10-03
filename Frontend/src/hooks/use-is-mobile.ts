import { useEffect, useState } from "react";

const MOBILE_QUERY = "(max-width: 1024px)";

function mobileMatch() {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia(MOBILE_QUERY).matches
  );
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(mobileMatch);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia(MOBILE_QUERY);
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return isMobile;
}

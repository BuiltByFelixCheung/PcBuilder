import { useEffect, useState } from "react";

const MOBILE_QUERY = "(max-width: 1024px)";

export function useIsMobile() {
  // The first paint matches the prerender, which has no viewport. The effect corrects it.
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const query = window.matchMedia(MOBILE_QUERY);
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return isMobile;
}

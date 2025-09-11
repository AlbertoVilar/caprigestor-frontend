import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function RouteChangeDebugger() {
  const loc = useLocation();

  useEffect(() => {
    // Mostra a rota atual para debug
    // (abra o console com F12)
    // eslint-disable-next-line no-console
    console.log(
      "[RouteChange]",
      loc.pathname + loc.search
    );
  }, [loc]);

  return null;
}

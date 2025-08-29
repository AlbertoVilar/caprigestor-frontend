import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function RouteChangeDebugger() {
  const loc = useLocation();

  useEffect(() => {
    // Mostra a rota atual e a stack de quem causou
    // (abra o console com F12)
    // eslint-disable-next-line no-console
    console.log(
      "[RouteChange]",
      loc.pathname + loc.search,
      "\nStack:\n",
      new Error().stack
    );
  }, [loc]);

  return null;
}

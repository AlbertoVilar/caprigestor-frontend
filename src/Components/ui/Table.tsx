import type { ReactNode } from "react";
import "./Table.css";

interface TableProps {
  children: ReactNode;
  className?: string;
}

export function Table({ children, className = "" }: TableProps) {
  return (
    <div className={["gf-table", className].filter(Boolean).join(" ")}>
      <table className="gf-table__element">{children}</table>
    </div>
  );
}

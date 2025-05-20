// src/Components/Topbar/page-header/PageHeader.tsx

import "./pageheader.css";

interface PageHeaderProps {
  title: string;
}

export default function PageHeader({ title }: PageHeaderProps) {
  return (
    <header className="page-header">
      <h1>{title}</h1>
    </header>
  );
}

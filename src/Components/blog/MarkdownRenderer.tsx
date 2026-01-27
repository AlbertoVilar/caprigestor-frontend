import DOMPurify from "dompurify";
import { marked } from "marked";

interface Props {
  markdown: string;
  className?: string;
}

export default function MarkdownRenderer({ markdown, className }: Props) {
  const html = DOMPurify.sanitize(marked.parse(markdown || ""));

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

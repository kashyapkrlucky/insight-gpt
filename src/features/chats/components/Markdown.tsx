"use client";

import { Children, isValidElement, memo, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { CopyButton } from "@/shared/ui/CopyButton";

const textOf = (node: ReactNode): string => {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return textOf(node.props.children);
  }
  return "";
};

function CodeBlock({ children }: { children: ReactNode }) {
  const child = Children.toArray(children)[0];
  const className = isValidElement<{ className?: string }>(child)
    ? child.props.className
    : undefined;
  const language = className?.match(/language-([\w-]+)/)?.[1];
  const code = textOf(children).replace(/\n$/, "");

  return (
    <div className="group/code my-4 overflow-hidden rounded-xl border border-border bg-code-bg text-code-fg first:mt-0 last:mb-0">
      <div className="flex items-center justify-between border-b border-white/10 py-1 pr-1 pl-3.5">
        <span className="font-mono text-[11px] text-white/50">
          {language ?? "text"}
        </span>
        <CopyButton
          text={code}
          label="Copy code"
          withText
          className="text-white/60 hover:bg-white/10 hover:text-white"
        />
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-6 [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-inherit">
        {children}
      </pre>
    </div>
  );
}

const components: Components = {
  h1: ({ children }) => (
    <h1 className="mt-6 mb-3 text-xl font-semibold first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-6 mb-2 text-lg font-semibold first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-5 mb-2 text-base font-semibold first:mt-0">{children}</h3>
  ),
  p: ({ children }) => <p className="my-3 first:mt-0 last:mb-0">{children}</p>,
  ul: ({ children }) => (
    <ul className="my-3 list-disc space-y-1.5 pl-6 marker:text-subtle first:mt-0 last:mb-0">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-3 list-decimal space-y-1.5 pl-6 marker:text-subtle first:mt-0 last:mb-0">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-1">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold text-fg">{children}</strong>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-2 border-accent/50 pl-4 text-muted italic">
      {children}
    </blockquote>
  ),
  a: ({ children, href }) => (
    <a
      className="font-medium text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent"
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      {children}
    </a>
  ),
  code: ({ children, className }) => (
    <code
      className={
        className ??
        "rounded-md bg-surface-3 px-1.5 py-0.5 font-mono text-[0.85em] text-fg"
      }
    >
      {children}
    </code>
  ),
  pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-xl border border-border first:mt-0 last:mb-0">
      <table className="w-full border-collapse text-left text-[13px]">
        {children}
      </table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-b border-border bg-surface-2 px-3 py-2 font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-border px-3 py-2 align-top [tr:last-child_&]:border-b-0">
      {children}
    </td>
  ),
  hr: () => <hr className="my-6 border-border" />,
};

export const Markdown = memo(function Markdown({
  content,
}: {
  content: string;
}) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </ReactMarkdown>
  );
});

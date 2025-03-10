import React from "react";
import remarkGfm from "remark-gfm";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import type { FC } from "react";

interface MarkdownExplanationProps {
  content: string;
  className?: string;
}

const MarkdownExplanation: FC<MarkdownExplanationProps> = ({
  content,
  className = "",
}) => {
  if (!content) return null;

  const customComponents: Partial<Components> = {
    h1: ({ children }) => (
      <h1 className="text-2xl font-bold mb-4 mt-6">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-xl font-semibold mb-3 mt-5">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-lg font-medium mb-2 mt-4">{children}</h3>
    ),
    p: ({ children }) => (
      <p className="mb-4 text-gray-700 leading-relaxed">{children}</p>
    ),
    ul: ({ children, ...props }) => {
      const depth = (props as any)?.node?.depth || 0;
      return (
        <ul
          className={`
          mb-4 space-y-2
          ${depth === 0 ? "list-disc pl-5" : "list-[circle] pl-5"}
        `}
        >
          {children}
        </ul>
      );
    },
    ol: ({ children, ...props }) => {
      const depth = (props as any)?.node?.depth || 0;
      return (
        <ol
          className={`
          mb-4 space-y-2 list-decimal
          ${depth === 0 ? "pl-5" : "pl-5"}
        `}
        >
          {children}
        </ol>
      );
    },
    li: ({ children, ...props }) => {
      const depth = (props as any)?.node?.depth || 0;
      const hasNestedList = React.Children.toArray(children).some(
        (child) =>
          React.isValidElement(child) &&
          (child.type === "ul" || child.type === "ol")
      );

      return (
        <li
          className={`
          text-gray-700 leading-relaxed
          ${hasNestedList ? "mb-2" : "mb-1"}
          ${depth > 0 ? "ml-4" : ""}
        `}
        >
          {children}
        </li>
      );
    },
    code: ({ children }) => {
      if (typeof children === "string") {
        const lines = children.split("\n");
        const listItems = lines
          .filter((line) => line.startsWith("* "))
          .map((line, index) => (
            <li key={index}>{line.substring(2).trimStart()}</li>
          ));

        const remainingLines = lines.filter((line) => !line.startsWith("* "));

        return (
          <code className="bg-gray-100 text-gray-800 rounded px-1.5 py-0.5 text-sm font-mono word-break-break-all break-words">
            {remainingLines.length > 0 && (
              <span>{remainingLines.join("\n")}</span>
            )}
            {listItems.length > 0 && <ul>{listItems}</ul>}
          </code>
        );
      }
      return (
        <code className="bg-gray-100 text-gray-800 rounded px-1.5 py-0.5 text-sm font-mono word-break-break-all break-words">
          {children}
        </code>
      );
    },
    pre: ({ children }) => (
      <pre className="bg-gray-100 rounded-lg p-4 overflow-x-auto mb-4 text-sm whitespace-pre-wrap break-wordsㅇ">
        {children}
      </pre>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold text-gray-900">{children}</strong>
    ),
    em: ({ children }) => <em className="italic text-gray-800">{children}</em>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-gray-200 pl-4 italic my-4 text-gray-700">
        {children}
      </blockquote>
    ),
    text: ({ children }) => {
      if (typeof children === "string" && children.startsWith("* ")) {
        return <span className="block ml-4">{children.substring(2)}</span>;
      }
      return <span>{children}</span>;
    },
  };

  // Pre-process the content to handle asterisk-based lists
  const processedContent = content.replace(/^\* /gm, "- ");

  return (
    <div className={`prose prose-gray max-w-none ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={customComponents}>
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownExplanation;

'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MarkdownProps {
  children: string;
  variant?: 'chat' | 'card';
  onQuestionClick?: (question: string) => void;
}

export const Markdown = ({ children, variant = 'chat', onQuestionClick }: MarkdownProps) => {
  // Preprocess markdown to handle #ask: links with spaces
  const preprocessedChildren = children.replace(
    /\[([^\]]+)\]\(#ask:([^)]+)\)/g,
    '[$1](<#ask:$2>)'
  );

  return (
    <div className="prose prose-sm max-w-none prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed text-text-primary">{children}</p>,
          a: ({ href, children }) => {
            // Handle clickable question links
            if (href?.startsWith('#ask:')) {
              const question = decodeURIComponent(href.replace('#ask:', ''));
              return (
                <button
                  onClick={() => onQuestionClick?.(question)}
                  className="text-primary hover:text-highlight underline font-medium cursor-pointer transition-colors glow-primary"
                >
                  {children}
                </button>
              );
            }
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-highlight underline"
              >
                {children}
              </a>
            );
          },
          code: ({ className, children, ...props }) => {
            // Inline code doesn't have a className (language-*), code blocks do
            const isInline = !className;
            if (isInline) {
              return (
                <code className="bg-[#1a1a1a] border border-primary/30 px-1.5 py-0.5 rounded text-sm font-mono text-primary">
                  {children}
                </code>
              );
            }
            return (
              <code className={cn("block bg-[#1a1a1a] border border-primary/30 p-3 rounded-lg my-3 overflow-x-auto text-sm font-mono text-text-primary", className)}>
                {children}
              </code>
            );
          },
          ul: ({ children }) => <ul className="list-disc pl-6 mb-3 space-y-1 text-text-primary">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-6 mb-3 space-y-1 text-text-primary">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>,
          em: ({ children }) => <em className="italic text-text-secondary">{children}</em>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/50 pl-4 my-3 text-text-secondary italic bg-[#1a1a1a] py-2 rounded-r">
              {children}
            </blockquote>
          ),
          h1: ({ children }) => <h1 className="text-2xl font-bold mb-3 mt-4 text-text-primary">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-bold mb-3 mt-4 text-text-primary">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-semibold mb-2 mt-3 text-text-primary">{children}</h3>,
          h4: ({ children }) => <h4 className="text-base font-semibold mb-2 mt-3 text-text-primary">{children}</h4>,
        }}
      >
        {preprocessedChildren}
      </ReactMarkdown>
    </div>
  );
};

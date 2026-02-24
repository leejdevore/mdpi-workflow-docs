'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownPreviewProps {
  content: string;
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  return (
    <div className="markdown-preview overflow-y-auto text-sm text-slate-800">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 pb-2 border-b border-slate-200">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-semibold mt-6 mb-3 pb-1 border-b border-slate-100">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-semibold mt-4 mb-2">{children}</h3>,
          h4: ({ children }) => <h4 className="text-base font-medium mt-3 mb-1">{children}</h4>,
          p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-0.5">{children}</ul>,
          ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-0.5">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-slate-300 pl-4 my-2 text-slate-600 italic">{children}</blockquote>
          ),
          code: ({ children, className }) => {
            const isBlock = className?.includes('language-');
            if (isBlock) {
              return (
                <code className="block bg-slate-900 text-slate-100 p-3 rounded text-xs overflow-x-auto my-2 whitespace-pre">
                  {children}
                </code>
              );
            }
            return <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded text-xs">{children}</code>;
          },
          pre: ({ children }) => <pre className="my-2">{children}</pre>,
          table: ({ children }) => (
            <div className="overflow-x-auto my-2">
              <table className="min-w-full text-xs border border-slate-200 rounded">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-slate-50">{children}</thead>,
          th: ({ children }) => <th className="px-3 py-1.5 text-left font-medium border-b border-slate-200">{children}</th>,
          td: ({ children }) => <td className="px-3 py-1.5 border-b border-slate-100">{children}</td>,
          hr: () => <hr className="my-4 border-slate-200" />,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic text-slate-600">{children}</em>,
          a: ({ children, href }) => (
            <a href={href} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

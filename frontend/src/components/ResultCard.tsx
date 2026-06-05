import { SearchResult } from "@/lib/api";

interface ResultCardProps {
  result: SearchResult;
}

export default function ResultCard({ result }: ResultCardProps) {
  const excerpt =
    result.chunk_text.length > 300
      ? result.chunk_text.slice(0, 300) + "..."
      : result.chunk_text;

  const matchPercent = Math.round(result.similarity * 100);

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm flex flex-col gap-2">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">{result.title}</h2>
          <p className="text-sm text-zinc-500">{result.author}</p>
        </div>
        <span className="shrink-0 px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 text-sm font-medium">
          {matchPercent}% match
        </span>
      </div>
      <blockquote className="text-sm text-zinc-600 border-l-2 border-zinc-200 pl-3 italic">
        {excerpt}
      </blockquote>
    </div>
  );
}

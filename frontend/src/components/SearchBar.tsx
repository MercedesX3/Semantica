interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

export default function SearchBar({ value, onChange, onSubmit, loading }: SearchBarProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="flex gap-2 w-full max-w-2xl"
    >
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by theme, emotion, or idea..."
        className="flex-1 px-4 py-2 rounded-lg border border-zinc-300 bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400"
      />
      <button
        type="submit"
        disabled={loading || value.trim().length === 0}
        className="px-5 py-2 rounded-lg bg-zinc-900 text-white font-medium disabled:opacity-50 hover:bg-zinc-700 transition-colors"
      >
        {loading ? "Searching..." : "Search"}
      </button>
    </form>
  );
}

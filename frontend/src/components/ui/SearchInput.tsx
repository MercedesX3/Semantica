import { Search } from "lucide-react";

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
}

export default function SearchInput({ containerClassName = "", className = "", ...props }: SearchInputProps) {
  return (
    <div
      className={`h-11 px-4 py-2.5 bg-stone-50 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline outline-2 outline-offset-[-2px] outline-black inline-flex items-center gap-2.5 ${containerClassName}`}
    >
      <Search className="w-5 h-5 shrink-0 text-black" />
      <input
        className={`bg-transparent outline-none text-lg font-semibold font-sans placeholder:text-black/40 flex-1 min-w-0 ${className}`}
        {...props}
      />
    </div>
  );
}

import AppNav from "@/components/AppNav";

/** Shared post-login chrome: identical outer margins + AppNav on every screen. */
export default function AppShell({
  children,
  className = "",
  fixedHeight = false,
}: {
  children: React.ReactNode;
  className?: string;
  /** Use fixed viewport height (book detail / map-style layouts). */
  fixedHeight?: boolean;
}) {
  const heightClass = fixedHeight
    ? "h-[calc(100vh-2rem)] overflow-hidden"
    : "min-h-[calc(100vh-2rem)]";

  return (
    <div className={`mx-8 my-4 ${heightClass} flex flex-col bg-white ${className}`}>
      <AppNav />
      {children}
    </div>
  );
}

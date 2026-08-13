import AppNav from "@/components/AppNav";
import RequireAuth from "@/components/RequireAuth";

/** Shared post-login chrome: consistent outer margins + AppNav on every screen. */
export default function AppShell({
  children,
  className = "",
  fixedHeight = false,
}: {
  children: React.ReactNode;
  className?: string;
  /**
   * Pin the shell to the viewport (book detail / map-style layouts).
   * Only applied from `lg` up — on small screens these layouts stack and
   * need to scroll with the page instead.
   */
  fixedHeight?: boolean;
}) {
  const heightClass = fixedHeight
    ? "min-h-[calc(100vh-1rem)] lg:h-[calc(100vh-2rem)] lg:overflow-hidden"
    : "min-h-[calc(100vh-1rem)] lg:min-h-[calc(100vh-2rem)]";

  return (
    <div
      className={`mx-2 my-2 sm:mx-4 lg:mx-8 lg:my-4 ${heightClass} flex flex-col bg-white edge ${className}`}
    >
      <AppNav />
      <RequireAuth>{children}</RequireAuth>
    </div>
  );
}

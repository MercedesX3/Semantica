export default function Footer() {
  return (
    <footer className="w-full border-t border-zinc-200 bg-white">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
        <p>&copy; {new Date().getFullYear()} Semantica. All rights reserved.</p>
        <div className="flex items-center gap-6">
          <a href="/#features" className="hover:text-zinc-900 transition-colors">
            Features
          </a>
          <a href="/#learn-more" className="hover:text-zinc-900 transition-colors">
            Learn More
          </a>
        </div>
      </div>
    </footer>
  );
}

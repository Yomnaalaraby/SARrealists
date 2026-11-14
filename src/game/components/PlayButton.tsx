import Link from 'next/link';

export function PlayButton() {
  return (
    <Link
      href="/game"
      className="inline-flex items-center gap-3 rounded-md border-2 border-cyan-300/70 bg-cyan-400/10 px-6 py-3 text-sm font-bold uppercase tracking-[0.2em] text-cyan-100 transition hover:bg-cyan-300/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300"
    >
      <span aria-hidden="true">▶</span>
      Play Captain DIO
    </Link>
  );
}

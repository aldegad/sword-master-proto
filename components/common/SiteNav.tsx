import Link from 'next/link';

export function SiteNav() {
  return (
    <header className="site-nav">
      <div className="site-nav-inner">
        <Link href="/" className="site-brand">
          Sword Master
        </Link>
        <nav className="site-links" aria-label="Primary">
          <Link className="site-link" href="/">
            홈
          </Link>
          <Link className="site-link" href="/game">
            게임
          </Link>
          <Link className="site-link" href="/rulebook">
            룰북
          </Link>
          <a
            className="site-link"
            href="https://github.com/aldegad/sword-master"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}

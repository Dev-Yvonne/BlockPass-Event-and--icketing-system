import { useState, MouseEvent, ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { LogoMark } from "./Logo";

const SECTION_LINKS = [
  { hash: "#problem", label: "Why BlockPass" },
  { hash: "#how-it-works", label: "How It Works" },
  { hash: "#features", label: "Platform" },
  { hash: "#organizers", label: "For Organizers" },
  { hash: "#faq", label: "FAQ" },
];

function HashLink({
  hash,
  className,
  children,
  onNavigate,
}: {
  hash: string;
  className?: string;
  children: ReactNode;
  onNavigate?: () => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    onNavigate?.();
    if (location.pathname === "/") {
      document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate(`/${hash}`);
    }
  }

  return (
    <a href={`/${hash}`} className={className} onClick={handleClick}>
      {children}
    </a>
  );
}

export function Nav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  function handleBrandClick(e: MouseEvent<HTMLAnchorElement>) {
    if (location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/");
    }
  }

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="brand" onClick={handleBrandClick}>
          <LogoMark size={26} />
          BlockPass
        </Link>

        <nav className="nav-links">
          {SECTION_LINKS.map((link) => (
            <HashLink key={link.hash} hash={link.hash}>
              {link.label}
            </HashLink>
          ))}
          <Link to="/contact">Contact</Link>
        </nav>

        <div className="nav-actions">
          <HashLink hash="#faq" className="btn btn-ghost">
            Learn more
          </HashLink>
        </div>

        <button
          className="nav-toggle"
          aria-label="Toggle navigation menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {open && (
        <div className="nav-mobile">
          {SECTION_LINKS.map((link) => (
            <HashLink key={link.hash} hash={link.hash} onNavigate={() => setOpen(false)}>
              {link.label}
            </HashLink>
          ))}
          <Link to="/contact" onClick={() => setOpen(false)}>
            Contact
          </Link>
        </div>
      )}
    </header>
  );
}

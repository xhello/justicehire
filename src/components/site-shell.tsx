"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  BusFront,
  Instagram,
  Menu,
  X,
  MessageCircle,
  Heart,
  MapPin,
} from "lucide-react";
import { site } from "@/data/site";

export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="BachataVan home">
      <span className="brand-mark">
        <BusFront size={25} strokeWidth={2.2} />
      </span>
      <span>
        Bachata<span className="brand-van">Van</span>
        <small>GOOD VIBES. GREAT RIDES.</small>
      </span>
    </Link>
  );
}

export function Modal({
  children,
  title,
  onClose,
}: {
  children: ReactNode;
  title: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = original;
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-label={title}
    >
      <div className="modal-inner">
        <button
          className="icon-button modal-close"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={22} />
        </button>
        {children}
      </div>
    </dialog>
  );
}

export function CommunityButton({
  className = "button button-dark",
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  if (site.whatsappInvite)
    return (
      <a
        className={className}
        href={site.whatsappInvite}
        target="_blank"
        rel="noreferrer"
      >
        <MessageCircle size={18} />
        {children || "Join the community"}
      </a>
    );
  return (
    <>
      <button className={className} onClick={() => setOpen(true)}>
        <MessageCircle size={18} />
        {children || "Join the community"}
      </button>
      {open && (
        <Modal
          title="Join the BachataVan community"
          onClose={() => setOpen(false)}
        >
          <span className="large-icon">
            <MessageCircle size={30} />
          </span>
          <p className="eyebrow">YOUR PEOPLE. YOUR NEXT NIGHT OUT.</p>
          <h2>
            Come for the dance.
            <br />
            Stay for the people.
          </h2>
          <p>
            Our WhatsApp community is where we share social parties, festival
            trips, bookings, and airport pickup information. Read the community
            rules before your first trip.
          </p>
          <div className="soft-note">
            Message <strong>@bachatavan_official</strong> on Instagram for the
            current WhatsApp invite.
          </div>
          <a
            className="button button-dark full-width"
            href={site.instagram}
            target="_blank"
            rel="noreferrer"
          >
            <Instagram size={18} />
            Contact us on Instagram
          </a>
        </Modal>
      )}
    </>
  );
}

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [
    { href: "/", text: "Home" },
    { href: "/calendar", text: "Trip calendar" },
    { href: "/faq", text: "FAQs" },
  ];
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="container nav-inner">
          <Brand />
          <nav className="desktop-nav" aria-label="Main navigation">
            {links.map((l) => (
              <Link
                href={l.href}
                key={l.href}
                className={pathname === l.href ? "active" : ""}
                aria-current={pathname === l.href ? "page" : undefined}
              >
                {l.text}
              </Link>
            ))}
          </nav>
          <div className="nav-actions">
            <a
              className="instagram-link"
              href={site.instagram}
              target="_blank"
              rel="noreferrer"
              aria-label="BachataVan on Instagram"
            >
              <Instagram size={22} />
            </a>
            <CommunityButton />
            <button
              className="mobile-menu-button icon-button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav
            id="mobile-navigation"
            className="mobile-nav"
            aria-label="Mobile navigation"
          >
            {links.map((l) => (
              <Link
                href={l.href}
                key={l.href}
                onClick={() => setMenuOpen(false)}
                aria-current={pathname === l.href ? "page" : undefined}
              >
                {l.text}
              </Link>
            ))}
            <CommunityButton />
          </nav>
        )}
      </header>
    </>
  );
}

export function CommunityBanner() {
  return (
    <section className="community-banner">
      <div>
        <p className="eyebrow">THE BEST PART? THE PEOPLE.</p>
        <h2>
          Your next night out
          <br />
          starts with a hello.
        </h2>
        <p>
          New in Barcelona or first on the dance floor?
          <br className="desktop-only" /> There’s a place for you in the
          BachataVan community.
        </p>
      </div>
      <div className="community-banner-action">
        <CommunityButton className="button button-dark" />
        <span>Trips, good company, and a shared love of dance.</span>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <div>
          <Brand />
          <p>Connecting people, one dance night at a time.</p>
          <span className="footer-location">
            <MapPin size={15} /> Barcelona, Spain
          </span>
        </div>
        <nav aria-label="Footer navigation">
          <Link href="/calendar">Trip calendar</Link>
          <Link href="/faq">FAQs</Link>
          <a href={site.instagram} target="_blank" rel="noreferrer">
            <Instagram size={17} />
            Instagram
          </a>
        </nav>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} BachataVan</span>
        <span>
          Made for the love of dance <Heart size={13} />
        </span>
      </div>
    </footer>
  );
}

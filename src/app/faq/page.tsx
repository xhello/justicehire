import type { Metadata } from "next";
import { Plus, MessageCircle } from "lucide-react";
import { faqs } from "@/data/site";
import { CommunityBanner, CommunityButton } from "@/components/site-shell";

export const metadata: Metadata = {
  title: "FAQs",
  description:
    "Your BachataVan questions answered: reservations and payment, punctuality, community rules, weekly dance trips, festivals, and airport pickups.",
};
const categories = [
  { title: "Getting started", id: "getting-started" },
  { title: "Booking & payment", id: "booking-payment" },
  { title: "The trip", id: "the-trip" },
  { title: "Community rules", id: "community-rules" },
];

export default function FaqPage() {
  return (
    <main id="main" className="container">
      <header className="page-heading">
        <p className="eyebrow">A FEW THINGS BEFORE WE GO</p>
        <h1>
          Good questions.
          <br />
          Easy answers.
        </h1>
        <p>From your first booking to the last song — here’s what to know.</p>
      </header>
      <div className="faq-layout">
        <aside className="faq-sidebar">
          <nav aria-label="FAQ topics">
            {categories.map((c) => (
              <a key={c.id} href={`#${c.id}`}>
                {c.title}
              </a>
            ))}
          </nav>
          <div className="faq-help">
            <MessageCircle size={27} />
            <h3>Still wondering?</h3>
            <p>We’re happy to help you plan your first BachataVan night.</p>
            <CommunityButton className="button button-dark full-width">
              Talk to the community
            </CommunityButton>
          </div>
        </aside>
        <div>
          {categories.map((category) => (
            <section className="faq-group" key={category.id} id={category.id}>
              <h2>{category.title}</h2>
              {faqs
                .filter((faq) => faq.category === category.title)
                .map((faq) => (
                  <details className="faq-item" key={faq.question}>
                    <summary>
                      {faq.question}
                      <Plus size={21} />
                    </summary>
                    <p>{faq.answer}</p>
                  </details>
                ))}
            </section>
          ))}
        </div>
      </div>
      <div className="banner-wrap">
        <CommunityBanner />
      </div>
    </main>
  );
}

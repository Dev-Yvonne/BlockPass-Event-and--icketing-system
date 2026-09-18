import { useState } from "react";
import { Plus } from "lucide-react";
import { Reveal } from "./Reveal";

const QUESTIONS = [
  {
    q: "Is BlockPass live for real purchases today?",
    a: "Not yet. BlockPass is in active development, building the checkout-to-ticket flow on the Stellar network so every ticket can be minted and verified on-chain. We'll share the date as soon as we're ready to open live events.",
  },
  {
    q: "Do I need a crypto wallet to buy a ticket?",
    a: "No. BlockPass creates and manages a secure custodial wallet for your account behind the scenes. You check out like any normal ticketing site — the on-chain minting happens automatically.",
  },
  {
    q: "How does BlockPass stop duplicate screenshots at the gate?",
    a: "Each ticket is a unique on-chain asset that can only be checked in once. When gate staff scan a ticket, the contract marks it used on the ledger — a second scan of a copied screenshot is rejected instantly.",
  },
  {
    q: "Which countries is BlockPass available in?",
    a: "We're building and testing with concert and community event organizers across Africa, since that's where the fake-ticket and duplicate-entry problems are most acute — the underlying platform isn't limited to a single country.",
  },
  {
    q: "What happens if I lose access to my account?",
    a: "Your tickets are tied to your BlockPass account, not a device. As long as you can sign back in, your verified tickets and their on-chain records are still there.",
  },
];

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq">
      <div className="container">
        <Reveal className="section-head center">
          <span className="eyebrow">FAQ</span>
          <h2 className="section-title">Questions, answered</h2>
        </Reveal>

        <Reveal delay={80} className="faq-list">
          {QUESTIONS.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={item.q} className={`faq-item ${isOpen ? "open" : ""}`}>
                <button
                  className="faq-question"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  aria-expanded={isOpen}
                >
                  {item.q}
                  <span className="faq-icon">
                    <Plus size={14} />
                  </span>
                </button>
                <div className="faq-answer">
                  <p>{item.a}</p>
                </div>
              </div>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}

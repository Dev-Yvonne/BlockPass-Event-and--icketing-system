import { useEffect, useState, FormEvent } from "react";
import { Mail, Clock, MapPin, Send, CheckCircle2 } from "lucide-react";
import { Reveal } from "../components/Reveal";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <main>
      <section id="contact-hero">
        <div className="container">
          <Reveal className="section-head center">
            <span className="eyebrow">Contact</span>
            <h1 className="section-title">Let's talk about your event</h1>
            <p className="section-sub">
              Organizing a concert or community event and curious about verified ticketing? Have
              a partnership or press question? Send us a message.
            </p>
          </Reveal>

          <div className="contact-layout">
            <Reveal className="contact-form-card">
              {submitted ? (
                <div className="contact-success">
                  <CheckCircle2 size={32} className="icon" />
                  <h3>Message received</h3>
                  <p>
                    Thanks for reaching out — our team will get back to you within 1–2 business
                    days.
                  </p>
                </div>
              ) : (
                <form className="contact-form" onSubmit={handleSubmit}>
                  <div className="form-row">
                    <label>
                      Full name
                      <input type="text" name="name" placeholder="Jane Doe" required />
                    </label>
                    <label>
                      Email address
                      <input type="email" name="email" placeholder="jane@example.com" required />
                    </label>
                  </div>
                  <label>
                    Organization <span className="optional">(optional)</span>
                    <input type="text" name="organization" placeholder="Event or company name" />
                  </label>
                  <label>
                    Message
                    <textarea
                      name="message"
                      rows={5}
                      placeholder="Tell us about your event or question..."
                      required
                    />
                  </label>
                  <button type="submit" className="btn btn-primary btn-lg">
                    Send message
                    <Send size={16} />
                  </button>
                </form>
              )}
            </Reveal>

            <Reveal delay={120} className="contact-info">
              <div className="info-card">
                <Mail size={20} className="icon" />
                <div>
                  <h4>Email us</h4>
                  <a href="mailto:hello@blockpass.app">hello@blockpass.app</a>
                </div>
              </div>
              <div className="info-card">
                <Clock size={20} className="icon" />
                <div>
                  <h4>Response time</h4>
                  <p>We typically reply within 1–2 business days.</p>
                </div>
              </div>
              <div className="info-card">
                <MapPin size={20} className="icon" />
                <div>
                  <h4>Where we work</h4>
                  <p>Building for organizers and attendees across Africa.</p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </main>
  );
}

import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Hero } from "../components/Hero";
import { Problem } from "../components/Problem";
import { Gallery } from "../components/Gallery";
import { AfricaMap } from "../components/AfricaMap";
import { HowItWorks } from "../components/HowItWorks";
import { Features } from "../components/Features";
import { WhyStellar } from "../components/WhyStellar";
import { ForOrganizers } from "../components/ForOrganizers";
import { Faq } from "../components/Faq";
import { CtaBand } from "../components/CtaBand";

export default function Landing() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0 });
      return;
    }
    const id = location.hash.slice(1);
    const target = document.getElementById(id);
    if (target) {
      requestAnimationFrame(() => target.scrollIntoView({ behavior: "smooth" }));
    }
  }, [location.pathname, location.hash]);

  return (
    <main>
      <Hero />
      <Problem />
      <Gallery />
      <AfricaMap />
      <HowItWorks />
      <Features />
      <WhyStellar />
      <ForOrganizers />
      <Faq />
      <CtaBand />
    </main>
  );
}

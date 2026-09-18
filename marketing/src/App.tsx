import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { Problem } from "./components/Problem";
import { HowItWorks } from "./components/HowItWorks";
import { Features } from "./components/Features";
import { WhyStellar } from "./components/WhyStellar";
import { ForOrganizers } from "./components/ForOrganizers";
import { Faq } from "./components/Faq";
import { CtaBand } from "./components/CtaBand";
import { Footer } from "./components/Footer";

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <Features />
        <WhyStellar />
        <ForOrganizers />
        <Faq />
        <CtaBand />
      </main>
      <Footer />
    </>
  );
}

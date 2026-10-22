import { useRef } from "react";
import Head from "next/head";
import { motion, useScroll, useTransform } from "framer-motion";

import Hero from "../components/Hero";
import RevealText from "../components/RevealText";
import Experience from "../components/Experience";
import Skills from "../components/Skills";
import Contact from "../components/Contact";
import { EMAIL } from "../components/data";

export default function Home() {
  const experienceRef = useRef(null);
  // The page turns ultramarine while the experience carousel is on screen.
  const { scrollYProgress } = useScroll({ target: experienceRef, offset: ["start end", "end start"] });
  const background = useTransform(
    scrollYProgress,
    [0, 0.2, 0.8, 1],
    ["#000000", "#1f2bd6", "#1f2bd6", "#000000"]
  );

  return (
    <>
      <Head>
        <title>Alain Logo, interface developer</title>
        <meta
          name="description"
          content="Alain Logo, French front-end developer at Studio218. Websites, online shops and web apps."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favico.png" />
      </Head>

      <nav className="nav" aria-label="Main">
        <a href="#top" className="nav_logo">
          Alain Logo
        </a>
        <ul className="nav_links">
          <li>
            <a href="#experience">Experience</a>
          </li>
          <li>
            <a href="#skills">Skills</a>
          </li>
          <li>
            <a href="#contact">Contact</a>
          </li>
        </ul>
        <a href={`mailto:${EMAIL}`} className="nav_mail">
          Email me
        </a>
      </nav>

      <motion.main className="main" style={{ backgroundColor: background }}>
        <Hero />

        <div ref={experienceRef}>
          <Experience />
        </div>

        <section className="about">
          <RevealText
            className="about_text"
            text="I studied programming for four years and went deep into web design and responsive interfaces. Today I build fast and accessible websites, from the first Figma frame to production."
          />
        </section>

        <Skills />
        <Contact />
      </motion.main>
    </>
  );
}

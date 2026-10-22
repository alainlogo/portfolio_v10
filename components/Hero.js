import { useRef } from "react";
import dynamic from "next/dynamic";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

const Scene3D = dynamic(() => import("./Scene3D"), { ssr: false });

const ease = [0.76, 0, 0.24, 1];

function Letters({ word, delay, outline }) {
  return (
    <span className={outline ? "hero_word outline" : "hero_word"} aria-hidden="true">
      {word.split("").map((letter, i) => (
        <span className="mask" key={i}>
          <motion.span
            className="letter"
            initial={{ y: "110%" }}
            animate={{ y: "0%" }}
            transition={{ duration: 1.1, ease, delay: delay + i * 0.04 }}
          >
            {letter}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

export default function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  // The two lines slide apart as you scroll, like the old parallax header.
  const xTop = useTransform(progress, [0, 1], ["0%", "-30%"]);
  const xBottom = useTransform(progress, [0, 1], ["0%", "30%"]);
  const sceneOpacity = useTransform(progress, [0.5, 1], [1, 0]);
  const introY = useTransform(progress, [0, 1], ["0%", "-120%"]);

  return (
    <section ref={ref} className="hero" id="top">
      <div className="hero_sticky">
        <motion.div className="hero_scene" style={{ opacity: sceneOpacity }}>
          <Scene3D className="hero_canvas" />
        </motion.div>

        <motion.p
          className="hero_intro"
          style={{ y: introY }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
        >
          I&apos;m Alain Logo, a French developer living between Annecy and the
          North of France. Front-end developer at Studio218 since 2026.
        </motion.p>

        <h1 className="hero_title">
          <span className="sr-only">Alain Logo, interface developer</span>
          <motion.span className="hero_line" style={{ x: xTop }}>
            <Letters word="Interface" delay={0.2} />
          </motion.span>
          <motion.span className="hero_line hero_line--right" style={{ x: xBottom }}>
            <Letters word="developer" delay={0.45} outline />
          </motion.span>
        </h1>
      </div>
    </section>
  );
}

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  animate,
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import useNarrow from "./useNarrow";

// WebGL only runs in the browser, and three.js stays out of the first bundle.
const Badge = dynamic(() => import("./Badge"), { ssr: false });
const WavyCubes = dynamic(() => import("./WavyCubes"), { ssr: false });

const ease = [0.76, 0, 0.24, 1];

function Line({ text, delay, ready }) {
  return (
    <span className="hero_line">
      <span className="mask">
        <motion.span
          className="hero_line_inner"
          initial={{ y: "110%" }}
          animate={ready ? { y: "0%" } : { y: "110%" }}
          transition={{ duration: 1.2, ease, delay }}
        >
          {text}
        </motion.span>
      </span>
    </span>
  );
}

function Clock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const format = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Paris",
    });
    const tick = () => setTime(format.format(new Date()));
    tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, []);
  return <span>Local time: {time || "--:--"} Paris</span>;
}

export default function Hero() {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const narrow = useNarrow();
  const [count, setCount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const ready = reduce || loaded;

  // A short counter plays before the headline comes in.
  useEffect(() => {
    if (reduce) return;
    const controls = animate(0, 100, {
      duration: 1.4,
      ease: [0.65, 0, 0.35, 1],
      onUpdate: (v) => setCount(Math.round(v)),
      onComplete: () => setLoaded(true),
    });
    return () => controls.stop();
  }, [reduce]);

  // While the hero is pinned, scrolling pushes each word off its own side.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const xLeft = useTransform(progress, [0, 1], ["0vw", "-110vw"]);
  const xRight = useTransform(progress, [0, 1], ["0vw", "110vw"]);
  const introFade = useTransform(progress, [0, 0.3], [1, 0]);
  const badgeY = useTransform(progress, [0, 0.6], ["0vh", "-110vh"]);

  return (
    <section ref={ref} className="hero" id="top">
      <div className="hero_sticky">
        <motion.div
          className="hero_loader"
          aria-hidden="true"
          animate={{ opacity: ready ? 0 : 1 }}
          transition={{ duration: 0.5 }}
        >
          {count}
        </motion.div>

        {/* A floor of cubes that ripple under the pointer, behind everything. */}
        <motion.div
          className="hero_cubes"
          initial={{ opacity: 0 }}
          animate={{ opacity: ready ? 1 : 0 }}
          transition={{ duration: 1.2 }}
        >
          <WavyCubes reduce={reduce} />
        </motion.div>

        {/* The lanyard badge drops in after the counter and is pulled back up
            as the hero scrolls away. */}
        <motion.div className="hero_badge" style={{ y: badgeY }}>
          <Badge ready={ready} reduce={reduce} anchorX={narrow ? 0.5 : 0.56} />
        </motion.div>

        <div className="hero_heading">
          {/* Fades in after the counter, then out as the words leave. */}
          <motion.div className="hero_intro" style={{ opacity: introFade }}>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
              transition={{ duration: 0.8, delay: 0.4, ease }}
            >
              I&apos;m Alain Logo, a French developer living between Annecy and
              the North of France.
            </motion.p>
          </motion.div>
          <h1 className="hero_title">
            <motion.span style={{ x: xLeft }} className="hero_row">
              <Line text="Creative" delay={0} ready={ready} />
            </motion.span>{" "}
            <motion.span style={{ x: xRight }} className="hero_row hero_row--right">
              <Line text="developer" delay={0.12} ready={ready} />
            </motion.span>
          </h1>
        </div>

        <motion.div
          className="hero_meta"
          initial={{ opacity: 0 }}
          animate={{ opacity: ready ? 1 : 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <Clock />
        </motion.div>
      </div>
    </section>
  );
}

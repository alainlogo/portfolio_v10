import { useRef } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion";
import { capabilities, techStack } from "./data";

// Keeps v inside [min, max) by wrapping around.
const wrap = (min, max, v) => {
  const range = max - min;
  return ((((v - min) % range) + range) % range) + min;
};

// A line of giant words drifting sideways, every other one outlined. It runs
// faster while the page scrolls, and both lines turn around with the scroll:
// scrolling down sends them their own way, scrolling up reverses them.
function Row({ words, speed }) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const { scrollY } = useScroll();
  const velocity = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 });
  const boost = useTransform(velocity, [0, 1000], [0, 3], { clamp: false });
  const direction = useRef(1);

  useAnimationFrame((_, delta) => {
    const b = boost.get();
    if (b < 0) direction.current = -1;
    else if (b > 0) direction.current = 1;
    // With reduced motion the lines keep their pace instead of rushing with
    // the scroll, but they still drift and still turn around.
    const rush = reduce ? 1 : 1 + Math.abs(b);
    const move = direction.current * speed * (delta / 1000) * rush;
    // The words are printed twice, so shifting by half the track loops seamlessly.
    x.set(wrap(-50, 0, x.get() + move));
  });

  const translate = useTransform(x, (v) => `${v}%`);

  return (
    <div className="marquee" aria-hidden="true">
      <motion.div className="marquee_track" style={{ x: translate }}>
        {[0, 1].map((copy) => (
          <div className="marquee_group" key={copy}>
            {words.map((word, i) => (
              <span className="marquee_item" key={word}>
                <span className={i % 2 ? "marquee_word outline" : "marquee_word"}>{word}</span>
                <span className="marquee_spark">✨</span>
              </span>
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export default function Skills() {
  return (
    <section className="skills" id="skills" aria-labelledby="skills-title">
      <div className="section_head">
        <h2 className="section_title" id="skills-title">
          Skills
        </h2>
      </div>

      {/* The marquees are decoration; screen readers get the plain lists. */}
      <h3 className="sr-only">Core capabilities: {capabilities.join(", ")}</h3>
      <Row words={capabilities} speed={-0.6} />

      <h3 className="sr-only">Tech stack: {techStack.join(", ")}</h3>
      <Row words={techStack} speed={0.6} />
    </section>
  );
}

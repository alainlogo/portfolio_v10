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
  wrap,
} from "framer-motion";

// A marquee that speeds up, and flips direction, with the scroll.
export default function VelocityMarquee({ items, baseVelocity = 3 }) {
  const reduce = useReducedMotion();
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const smoothVelocity = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 4], { clamp: false });
  const direction = useRef(1);

  // The row is rendered four times, so wrapping over a quarter is seamless.
  const x = useTransform(baseX, (v) => `${wrap(-25, 0, v)}%`);

  useAnimationFrame((_, delta) => {
    if (reduce) return;
    const factor = velocityFactor.get();
    if (factor < 0) direction.current = -1;
    else if (factor > 0) direction.current = 1;
    let move = direction.current * baseVelocity * (delta / 1000);
    move += direction.current * move * Math.abs(factor);
    baseX.set(baseX.get() + move);
  });

  const row = items.map((item, i) => (
    <span key={item} className={i % 2 ? "marquee_item outline" : "marquee_item"}>
      {item}
      <span className="marquee_dot" aria-hidden="true" />
    </span>
  ));

  return (
    <div className="marquee">
      <span className="sr-only">{items.join(", ")}</span>
      <motion.div className="marquee_track" style={{ x }} aria-hidden="true">
        {[0, 1, 2, 3].map((n) => (
          <span className="marquee_row" key={n}>
            {row}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

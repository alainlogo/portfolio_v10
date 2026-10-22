import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { heroTags } from "./data";

const ease = [0.76, 0, 0.24, 1];
// How far the cursor travels before the next image shows up.
const STEP = 140;

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
  const stickyRef = useRef(null);
  const reduce = useReducedMotion();
  const [count, setCount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const ready = reduce || loaded;
  const [tag, setTag] = useState(0);

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

  // The crosshair follows the cursor. Its resting place is set in CSS units
  // so it renders in the right spot before any pointer move.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const x = useSpring(px, { stiffness: 140, damping: 22 });
  const y = useSpring(py, { stiffness: 140, damping: 22 });
  const travel = useRef(0);
  const last = useRef(null);
  const moved = useRef(0);

  useEffect(() => {
    const box = stickyRef.current.getBoundingClientRect();
    px.jump(box.width * 0.62);
    py.jump(box.height * 0.36);
    x.jump(box.width * 0.62);
    y.jump(box.height * 0.36);
  }, [px, py, x, y]);

  const onMove = (e) => {
    if (e.pointerType !== "mouse") return;
    const box = stickyRef.current.getBoundingClientRect();
    const nx = e.clientX - box.left;
    const ny = e.clientY - box.top;
    px.set(nx);
    py.set(ny);
    moved.current = performance.now();
    if (last.current) {
      travel.current += Math.hypot(nx - last.current[0], ny - last.current[1]);
      if (travel.current > STEP) {
        travel.current = 0;
        setTag((t) => (t + 1) % heroTags.length);
      }
    }
    last.current = [nx, ny];
  };

  // Without a mouse (or while it rests) the images keep cycling on their own.
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => {
      if (performance.now() - moved.current > 1800) setTag((t) => (t + 1) % heroTags.length);
    }, 1800);
    return () => clearInterval(id);
  }, [reduce]);

  // While the hero is pinned, scrolling pushes each word off its own side.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const xLeft = useTransform(progress, [0, 1], ["0vw", "-110vw"]);
  const xRight = useTransform(progress, [0, 1], ["0vw", "110vw"]);
  const introFade = useTransform(progress, [0, 0.3], [1, 0]);

  const current = heroTags[tag];

  return (
    <section ref={ref} className="hero" id="top" onPointerMove={onMove}>
      <div className="hero_sticky" ref={stickyRef}>
        <motion.div
          className="hero_loader"
          aria-hidden="true"
          animate={{ opacity: ready ? 0 : 1 }}
          transition={{ duration: 0.5 }}
        >
          {count}
        </motion.div>

        {/* Lines and captions invert whatever they cross (white text turns
            black under them); the image sits in its own layer and doesn't. */}
        <motion.div
          className="hero_cross"
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: ready ? 1 : 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <motion.span className="cross_v" style={{ x }} />
          <motion.span className="cross_h" style={{ y }} />
          <motion.span className="cross_label" style={{ y }}>
            Developer
          </motion.span>
          <motion.span className="cross_tag" style={{ x, y }}>
            [{current.label}]
          </motion.span>
        </motion.div>

        <motion.div
          className="hero_card_layer"
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: ready ? 1 : 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <motion.div className="cross_card" style={{ x, y }}>
            {heroTags.map((t, i) => (
              <Image
                key={t.label}
                src={t.image}
                alt=""
                fill
                sizes="160px"
                priority={i === 0}
                style={{ opacity: i === tag ? 1 : 0 }}
              />
            ))}
          </motion.div>
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
              <Line text="Interface" delay={0} ready={ready} />
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

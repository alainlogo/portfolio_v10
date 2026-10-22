import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import { works } from "./data";

function Card({ work }) {
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rotateX = useSpring(rx, { stiffness: 200, damping: 20 });
  const rotateY = useSpring(ry, { stiffness: 200, damping: 20 });

  const onMove = (e) => {
    if (e.pointerType !== "mouse") return;
    const box = e.currentTarget.getBoundingClientRect();
    ry.set(((e.clientX - box.left) / box.width - 0.5) * 16);
    rx.set(-((e.clientY - box.top) / box.height - 0.5) * 16);
  };
  const reset = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.article
      className="card"
      style={{ rotateX, rotateY }}
      onPointerMove={onMove}
      onPointerLeave={reset}
    >
      <div className="card_img">
        <Image src={work.image} alt={`${work.company} website`} fill sizes="(max-width: 768px) 90vw, 40vw" />
      </div>
      <div className="card_meta">
        <h3>{work.company}</h3>
        <p>
          {work.type}, {work.period}
        </p>
      </div>
    </motion.article>
  );
}

export default function Works() {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const [distance, setDistance] = useState(0);

  // How far the track must travel so its last card ends at the right edge.
  useEffect(() => {
    const measure = () => {
      const track = trackRef.current;
      setDistance(Math.max(track.scrollWidth - window.innerWidth, 0));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const x = useSpring(useTransform(scrollYProgress, [0, 1], [0, -distance]), {
    stiffness: 120,
    damping: 30,
  });

  return (
    <section
      className="works"
      id="work"
      ref={sectionRef}
      style={{ height: distance ? `calc(100vh + ${distance}px)` : undefined }}
    >
      <div className="works_sticky">
        <div className="section_head">
          <h2 className="section_title">Selected work</h2>
        </div>
        <motion.div className="works_track" ref={trackRef} style={{ x }}>
          {works.map((work) => (
            <Card key={work.company} work={work} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

import { useRef } from "react";
import Image from "next/image";
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import plane from "../img/avion.gif";
import { EMAIL } from "./data";

// The link leans towards the cursor when it gets close.
function Magnetic({ children, ...props }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 15 });
  const sy = useSpring(y, { stiffness: 200, damping: 15 });

  const onMove = (e) => {
    if (e.pointerType !== "mouse") return;
    const box = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - box.left - box.width / 2) * 0.3);
    y.set((e.clientY - box.top - box.height / 2) * 0.3);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.a style={{ x: sx, y: sy }} onPointerMove={onMove} onPointerLeave={reset} {...props}>
      {children}
    </motion.a>
  );
}

export default function Contact() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const planeX = useTransform(scrollYProgress, [0, 1], ["-30%", "40%"]);
  const planeRotate = useTransform(scrollYProgress, [0, 1], [-6, 3]);
  const titleScale = useTransform(scrollYProgress, [0, 1], [0.8, 1]);

  return (
    <section className="contact" id="contact" ref={ref}>
      <motion.h2 className="contact_title" style={{ scale: titleScale }}>
        <span>Let&apos;s build</span>
        <span className="outline">something</span>
      </motion.h2>

      <motion.div className="contact_plane" style={{ x: planeX, rotate: planeRotate }} aria-hidden="true">
        <Image src={plane} alt="" fill sizes="(max-width: 768px) 70vw, 420px" unoptimized />
      </motion.div>

      <p className="contact_text">
        Have an idea or a project? I&apos;m always happy to talk about it and
        answer your questions.
      </p>

      <Magnetic className="contact_mail" href={`mailto:${EMAIL}`}>
        {EMAIL}
      </Magnetic>

      <footer className="footer">
        <ul>
          <li>
            <a href="https://www.linkedin.com/in/alain-logossoukpe-500323217/" target="_blank" rel="noreferrer">
              LinkedIn
            </a>
          </li>
          <li>
            <a href="https://github.com/alainlogo" target="_blank" rel="noreferrer">
              GitHub
            </a>
          </li>
        </ul>
        <p>Alain Logo, {new Date().getFullYear()}</p>
      </footer>
    </section>
  );
}

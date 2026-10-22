import { useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useMotionValue, useScroll, useSpring } from "framer-motion";
import { experience } from "./data";

export default function Experience() {
  const ref = useRef(null);
  const [active, setActive] = useState(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.7", "end 0.7"] });
  const lineScale = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  // The project preview trails the cursor on devices that can hover.
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const x = useSpring(mouseX, { stiffness: 150, damping: 20 });
  const y = useSpring(mouseY, { stiffness: 150, damping: 20 });

  const onMove = (e) => {
    mouseX.set(e.clientX);
    mouseY.set(e.clientY);
  };

  return (
    <section className="experience" id="experience" ref={ref} onPointerMove={onMove}>
      <div className="section_head">
        <h2 className="section_title">Experience</h2>
        <p className="section_lead">
          Websites, online shops and products I&apos;ve built since 2021, most
          recent first.
        </p>
      </div>

      <ol className="timeline">
        <motion.span className="timeline_line" style={{ scaleY: lineScale }} aria-hidden="true" />
        {experience.map((job, i) => (
          <li
            key={job.company}
            className={job.current ? "job job--current" : "job"}
            onPointerEnter={(e) => e.pointerType === "mouse" && setActive(job.image ? i : null)}
            onPointerLeave={() => setActive(null)}
          >
            <span className="job_dot" aria-hidden="true" />
            <p className="job_period">{job.period}</p>
            <div className="job_main">
              <h3 className="job_company">{job.company}</h3>
              <p className="job_role">
                {job.role}, {job.type.toLowerCase()}
              </p>
            </div>
            <p className="job_desc">{job.description}</p>
          </li>
        ))}
      </ol>

      <motion.div className="preview" style={{ x, y }} aria-hidden="true">
        <AnimatePresence>
          {active !== null && (
            <motion.div
              key={active}
              className="preview_inner"
              initial={{ scale: 0.6, opacity: 0, rotate: -6 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.6, opacity: 0, rotate: 6 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <Image src={experience[active].image} alt="" fill sizes="320px" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}

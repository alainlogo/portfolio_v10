import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { experience } from "./data";

const spring = { stiffness: 140, damping: 30, mass: 0.4 };

// Each step plays as the entry rises through the screen: the dot lights up,
// the year and company slide in, then the image unveils from the bottom.
function Entry({ job }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.9", "start 0.35"] });
  const p = useSpring(scrollYProgress, spring);

  const dot = useTransform(p, [0, 0.25], [0, 1]);
  const yearY = useTransform(p, [0, 0.35], [40, 0]);
  const yearOpacity = useTransform(p, [0, 0.35], [0, 1]);
  const nameY = useTransform(p, [0.1, 0.45], ["110%", "0%"]);
  const metaOpacity = useTransform(p, [0.3, 0.55], [0, 1]);
  const clip = useTransform(p, [0.35, 0.85], ["inset(100% 0% 0% 0%)", "inset(0% 0% 0% 0%)"]);
  const zoom = useTransform(p, [0.35, 1], [1.25, 1]);
  const descY = useTransform(p, [0.6, 1], [24, 0]);
  const descOpacity = useTransform(p, [0.6, 1], [0, 1]);

  return (
    <li ref={ref} className="timeline_item">
      <span className="timeline_dot" aria-hidden="true">
        <motion.span className="timeline_dot_fill" style={{ scale: dot }} />
      </span>

      <motion.p className="timeline_year" style={{ y: yearY, opacity: yearOpacity }}>
        {job.period}
        {job.current && <span className="timeline_now">Now</span>}
      </motion.p>

      <h3 className="timeline_company">
        <span className="mask">
          <motion.span className="mask_inner" style={{ y: nameY }}>
            {job.company}
          </motion.span>
        </span>
      </h3>

      <motion.p className="timeline_meta" style={{ opacity: metaOpacity }}>
        {job.role} · {job.type}
      </motion.p>

      <motion.div className="timeline_image" style={{ clipPath: clip }}>
        <motion.div className="timeline_image_inner" style={{ scale: zoom }}>
          <Image src={job.image} alt={`${job.company} website`} fill sizes="100vw" placeholder="blur" />
        </motion.div>
      </motion.div>

      <motion.p className="timeline_desc" style={{ y: descY, opacity: descOpacity }}>
        {job.description}
      </motion.p>
    </li>
  );
}

// The phone version of the experience section: a vertical history whose line
// draws itself down the page as you scroll.
export default function Timeline() {
  const listRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: listRef, offset: ["start 0.7", "end 0.6"] });
  const line = useSpring(scrollYProgress, spring);

  return (
    <section className="timeline" id="experience">
      <div className="section_head">
        <h2 className="section_title">Experience</h2>
      </div>

      <ol className="timeline_list" ref={listRef}>
        <span className="timeline_track" aria-hidden="true" />
        <motion.span className="timeline_line" aria-hidden="true" style={{ scaleY: line }} />
        {experience.map((job) => (
          <Entry key={job.company} job={job} />
        ))}
      </ol>
    </section>
  );
}

import { useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { experience } from "./data";

const FlexCarousel = dynamic(() => import("./reactbits/FlexCarousel"), { ssr: false });

const items = experience.map((job) => ({
  src: job.image.src,
  alt: `${job.company} website`,
  title: job.company,
  subtitle: job.period,
}));

const narrowQuery = "(max-width: 640px)";
const subscribe = (onChange) => {
  const media = window.matchMedia(narrowQuery);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
};

export default function Experience() {
  const [active, setActive] = useState(0);
  const narrow = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(narrowQuery).matches,
    () => false
  );
  const job = experience[active];

  return (
    <section className="experience" id="experience">
      <div className="section_head">
        <h2 className="section_title">Experience</h2>
      </div>

      <div className="experience_carousel">
        {/* Cards stay small within a tall canvas, so the glass bend at the
            edges has room and they only ever leave through the sides. */}
        <FlexCarousel
          items={items}
          loop={false}
          cardHeight={narrow ? 0.3 : 0.42}
          gap={16}
          radius={6}
          onChange={(i) => setActive(i)}
        />
      </div>

      <div className="job_detail" aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.div
            key={job.company}
            className="job_detail_inner"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="job_role">
              {job.role}, {job.type.toLowerCase()}
            </p>
            <p className="job_desc">{job.description}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { experience } from "./data";
import useNarrow from "./useNarrow";

const FlexCarousel = dynamic(() => import("./reactbits/FlexCarousel"), { ssr: false });

const items = experience.map((job) => ({
  src: job.image.src,
  alt: `${job.company} website`,
  title: job.company,
  subtitle: job.period,
}));

export default function Experience() {
  const ref = useRef(null);
  const [active, setActive] = useState(0);
  const [scrollIndex, setScrollIndex] = useState(0);
  const narrow = useNarrow();

  // The section is pinned while the page scrolls past it. Each job gets an
  // equal share of that scroll, the first one included, so its description
  // can be read before the next card slides in.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setScrollIndex(Math.min(experience.length - 1, Math.floor(v * experience.length)));
  });

  const job = experience[active];

  return (
    <section
      className="experience"
      id="experience"
      ref={ref}
      style={{ "--steps": experience.length - 1 }}
    >
      <div className="experience_pin">
        <div className="section_head">
          <h2 className="section_title">Experience</h2>
        </div>

        <div className="experience_stage">
          <div className="experience_carousel">
            <FlexCarousel
              items={items}
              loop={false}
              index={scrollIndex}
              captureWheel={false}
              cardHeight={narrow ? 0.24 : 0.36}
              // The glass bends less on phones, where the lens spans most of the card.
              bend={narrow ? 0.2 : undefined}
              dispersion={narrow ? 0.3 : undefined}
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
        </div>
      </div>
    </section>
  );
}

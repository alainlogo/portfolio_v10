import CurvedLoop from "./reactbits/CurvedLoop";
import LogoLoop from "./reactbits/LogoLoop";
import { capabilities, techStack } from "./data";
import useNarrow from "./useNarrow";

const logos = techStack.map((name) => ({
  node: <span className="tech_name">{name}</span>,
  title: name,
  ariaLabel: name,
}));

// What I do bends along a curve; what I do it with runs underneath.
// Both can be dragged, and both speed up with the page scroll.
export default function Skills() {
  const narrow = useNarrow();

  return (
    <section className="skills" id="skills" aria-labelledby="skills-title">
      <div className="section_head">
        <h2 className="section_title" id="skills-title">
          Skills
        </h2>
      </div>

      <h3 className="sr-only">Core capabilities</h3>
      <div className="skills_curve">
        <CurvedLoop
          marqueeText={capabilities.join(" ✦ ")}
          separator="✦"
          className="curved_text"
          speed={1.2}
          curveAmount={narrow ? 180 : 260}
          // The curve scales with the screen width, so phones need larger type.
          fontSize={narrow ? 150 : 84}
          fontWeight={800}
          scrollBoost={1}
        />
      </div>

      <h3 className="sr-only">Tech stack</h3>
      <div className="skills_logos">
        <LogoLoop
          logos={logos}
          speed={60}
          // Keeps its pace under the cursor instead of pausing.
          hoverSpeed={60}
          logoHeight={36}
          gap={56}
          scrollBoost={0.6}
          ariaLabel="Tech stack"
        />
      </div>
    </section>
  );
}

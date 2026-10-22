import { useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import { skillSets } from "./data";

const COLORS = ["#1f2bd6", "#8f96ff", "#ffb27a", "#ff8fc8", "#3fa07a", "#b9b9b4"];

// Pills and stickers drop into the box and pile up. They can be grabbed and
// thrown with the mouse; on touch screens a tap shakes the box instead.
function Playground({ items, stickers }) {
  const boxRef = useRef(null);
  const nodesRef = useRef([]);

  useEffect(() => {
    const box = boxRef.current;
    const { Engine, Bodies, Body, Composite, Mouse, MouseConstraint } = Matter;
    const engine = Engine.create({ gravity: { y: 1.1 } });
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = box.clientWidth;
    let height = box.clientHeight;

    const wall = 200;
    const walls = [
      Bodies.rectangle(width / 2, height + wall / 2, width * 3, wall, { isStatic: true }),
      Bodies.rectangle(-wall / 2, height / 2, wall, height * 4, { isStatic: true }),
      Bodies.rectangle(width + wall / 2, height / 2, wall, height * 4, { isStatic: true }),
    ];
    Composite.add(engine.world, walls);

    const bodies = nodesRef.current.map((node, i) => {
      const w = node.offsetWidth;
      const h = node.offsetHeight;
      const round = node.dataset.shape === "circle";
      const x = w / 2 + Math.random() * Math.max(width - w, 1);
      // Reduced motion: start piled near the floor instead of raining down.
      const y = reduce ? height - h - Math.random() * height * 0.4 : -h - i * 40 - Math.random() * 200;
      const options = { restitution: 0.3, friction: 0.4, angle: (Math.random() - 0.5) * 1.2 };
      return round
        ? Bodies.circle(x, y, w / 2, options)
        : Bodies.rectangle(x, y, w, h, { ...options, chamfer: { radius: h / 2 } });
    });

    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      Composite.add(engine.world, bodies);
    };

    let mouseConstraint;
    if (window.matchMedia("(hover: hover)").matches) {
      const mouse = Mouse.create(box);
      mouse.pixelRatio = 1;
      // Matter grabs the wheel by default, which would block page scrolling.
      box.removeEventListener("wheel", mouse.mousewheel);
      box.removeEventListener("DOMMouseScroll", mouse.mousewheel);
      mouseConstraint = MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.2, render: { visible: false } } });
      Composite.add(engine.world, mouseConstraint);
    }

    const shake = () => {
      if (mouseConstraint) return;
      bodies.forEach((body) => {
        Body.setVelocity(body, { x: (Math.random() - 0.5) * 12, y: -10 - Math.random() * 10 });
        Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.3);
      });
    };
    box.addEventListener("click", shake);

    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && start(), {
      threshold: 0.3,
    });
    observer.observe(box);

    const onResize = () => {
      const w = box.clientWidth;
      const h = box.clientHeight;
      Body.setPosition(walls[0], { x: w / 2, y: h + wall / 2 });
      Body.setPosition(walls[2], { x: w + wall / 2, y: h / 2 });
      // Anything left outside the new bounds comes back in from the top.
      bodies.forEach((body) => {
        if (body.position.x > w) Body.setPosition(body, { x: w / 2, y: -50 });
      });
      width = w;
      height = h;
    };
    window.addEventListener("resize", onResize);

    let frame;
    let last = performance.now();
    const loop = (now) => {
      Engine.update(engine, Math.min(now - last, 32));
      last = now;
      bodies.forEach((body, i) => {
        const node = nodesRef.current[i];
        const { x, y } = body.position;
        node.style.transform = `translate(${x - node.offsetWidth / 2}px, ${y - node.offsetHeight / 2}px) rotate(${body.angle}rad)`;
      });
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", onResize);
      box.removeEventListener("click", shake);
      if (mouseConstraint) Mouse.clearSourceEvents(mouseConstraint.mouse);
      Engine.clear(engine);
    };
  }, []);

  const all = [
    ...items.map((label) => ({ label, shape: "pill" })),
    ...stickers.map((label) => ({ label, shape: "circle" })),
  ];

  return (
    <div className="playground" ref={boxRef} aria-hidden="true">
      {all.map((item, i) => (
        <span
          key={item.label}
          ref={(node) => (nodesRef.current[i] = node)}
          data-shape={item.shape}
          className={item.shape === "circle" ? "chip chip--sticker" : "chip"}
          style={{ backgroundColor: COLORS[i % COLORS.length] }}
        >
          {item.label}
        </span>
      ))}
    </div>
  );
}

export default function Skills() {
  const [tab, setTab] = useState(0);

  return (
    <section className="skills" id="skills" aria-labelledby="skills-title">
      <div className="section_head">
        <h2 className="section_title" id="skills-title">
          Skills
        </h2>
        <div className="tabs" role="tablist" aria-label="Skill groups">
          {skillSets.map((set, i) => (
            <button
              key={set.name}
              role="tab"
              aria-selected={tab === i}
              className={tab === i ? "tab tab--active" : "tab"}
              onClick={() => setTab(i)}
            >
              {set.name}
            </button>
          ))}
        </div>
      </div>

      <div className="skills_box">
        <p className="skills_hint">
          <span className="hint_mouse">Grab them and throw them around.</span>
          <span className="hint_touch">Tap the box to shake it.</span>
        </p>
        {/* Remounting on tab change drops the new set in from the top. */}
        <Playground key={tab} items={skillSets[tab].items} stickers={skillSets[tab].stickers} />
        <ul className="sr-only">
          {skillSets[tab].items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

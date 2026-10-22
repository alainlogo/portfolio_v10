import neo from "../img/neo.jpg";
import alpin from "../img/alpin1.jpg";
import talentissim from "../img/tl3.jpg";
import stella from "../img/stella.jpg";
import atout from "../img/st.jpg";
import studio218 from "../img/studio218.jpg";

export const EMAIL = "alaindev54@gmail.com";

// The images that flash in the hero crosshair, each with what it stands for.
export const heroTags = [
  { label: "UI / UX", image: stella },
  { label: "High performance", image: neo },
  { label: "Responsive", image: talentissim },
  { label: "E-commerce", image: atout },
  { label: "Accessibility", image: alpin },
];

export const skillSets = [
  {
    name: "Core capabilities",
    items: [
      "Creative front-end",
      "Motion & interaction",
      "Responsive design",
      "Performance",
      "E-commerce",
      "SaaS & web apps",
      "UI / UX",
      "Accessibility",
      "SEO",
      "3D on the web",
    ],
    stickers: ["⚡", "🎨", "🚀", "🛒", "🧩", "✨"],
  },
  {
    name: "Tech stack",
    items: [
      "HTML5",
      "CSS3",
      "JavaScript",
      "React",
      "Next.js",
      "Angular",
      "Node.js",
      "Go",
      "Firebase",
      "MongoDB",
      "WordPress",
      "Three.js",
      "Framer Motion",
      "Figma",
      "GitHub",
      "Jira",
    ],
    stickers: ["💻", "🛠️", "🪐", "🎯"],
  },
];

// Ordered most recent first: rendered as a timeline.
export const experience = [
  {
    company: "Studio218",
    role: "Front-end developer",
    period: "2026 — now",
    type: "Studio",
    current: true,
    image: studio218,
    description:
      "I joined Studio218 in 2026. I build websites and web apps for the studio's clients, from the design handoff to production, with a focus on motion, performance and clean, maintainable front-end code.",
  },
  {
    company: "Neootem",
    role: "Front-end developer",
    period: "2024",
    type: "SaaS",
    image: neo,
    description:
      "Worked on a SaaS platform: built dashboards, complex forms and a library of reusable React components shared across the product.",
  },
  {
    company: "AlpinStore / PIM",
    role: "Web developer",
    period: "2022",
    type: "E-commerce",
    image: alpin,
    description:
      "Built a product information management tool that centralises the catalogue and keeps the online store in sync, so the team edits a product once.",
  },
  {
    company: "Talentissim",
    role: "Web developer",
    period: "2022",
    type: "Service",
    image: talentissim,
    description:
      "Designed and developed the company website: page templates, responsive layouts and the contact flows that bring in new clients.",
  },
  {
    company: "Stella Green",
    role: "Web developer",
    period: "2021",
    type: "E-commerce",
    image: stella,
    description:
      "Developed an online shop from mobile up: product pages, cart and checkout, tuned for fast loading on phones.",
  },
  {
    company: "Atout Beauté",
    role: "Web developer",
    period: "2021",
    type: "E-commerce",
    image: atout,
    description:
      "Built the e-commerce site of a beauty brand: catalogue, product pages and a checkout that is simple to use on any screen.",
  },
];

/**
 * Offline "AI" tutor engine.
 * Everything runs in the browser — no API keys, no network calls.
 * It solves arithmetic, linear equations, kinematics, and explains
 * common study topics from a small curated knowledge base.
 */

type Solver = (q: string) => string | null;

/* ------------------------------- arithmetic ------------------------------- */

/** Safely evaluates a numeric expression (digits and operators only). */
function evaluateExpression(expr: string): number | null {
  const cleaned = expr
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/\^/g, "**")
    .replace(/[^0-9+\-*/().\s]/g, "");
  if (!/[0-9]/.test(cleaned) || !/[+\-*/]/.test(cleaned)) return null;
  try {
    // eslint-disable-next-line no-new-func
    const value = Function(`"use strict"; return (${cleaned});`)() as unknown;
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

const round = (n: number) => Math.round(n * 1000) / 1000;

const arithmetic: Solver = (q) => {
  if (/=/.test(q)) return null;
  const match = q.match(/[-+*/^().\d\s×÷]{3,}/);
  if (!match) return null;
  const result = evaluateExpression(match[0] ?? "");
  if (result === null) return null;
  return `**${match[0].trim()} = ${round(result)}**\n\nI evaluated it left to right using operator precedence (brackets → powers → × ÷ → + −). Try changing a number and asking again to see how the result moves.`;
};

/* ---------------------------- linear equations ---------------------------- */

/** Solves equations of the form ax + b = cx + d. */
const linearEquation: Solver = (q) => {
  const eq = q.match(/([-+*/^().\dxX\s]+)=([-+*/^().\dxX\s]+)/);
  if (!eq || !/x/i.test(q)) return null;

  const parseSide = (side: string) => {
    let a = 0;
    let b = 0;
    const terms = side.replace(/\s+/g, "").replace(/-/g, "+-").split("+").filter(Boolean);
    for (const term of terms) {
      if (/x/i.test(term)) {
        const coefficient = term.replace(/x/i, "");
        a += coefficient === "" || coefficient === "+" ? 1 : coefficient === "-" ? -1 : Number(coefficient);
      } else {
        b += Number(term);
      }
    }
    return Number.isFinite(a) && Number.isFinite(b) ? { a, b } : null;
  };

  const left = parseSide(eq[1] ?? "");
  const right = parseSide(eq[2] ?? "");
  if (!left || !right) return null;

  const a = left.a - right.a;
  const b = right.b - left.b;
  if (a === 0) return b === 0 ? "Every value of x works — the two sides are identical." : "No solution: the x terms cancel but the constants don't match.";

  return `**x = ${round(b / a)}**\n\nStep 1 — move all x terms to the left and numbers to the right: ${round(a)}x = ${round(b)}\nStep 2 — divide both sides by ${round(a)}: x = ${round(b)} ÷ ${round(a)} = ${round(b / a)}`;
};

/* ------------------------------- kinematics ------------------------------- */

const kinematics: Solver = (q) => {
  if (!/(equation|equations) of motion|kinematic|suvat/i.test(q)) return null;
  return `**Equations of motion (constant acceleration)**\n\n1. v = u + at\n2. s = ut + ½at²\n3. v² = u² + 2as\n4. s = ((u + v) / 2) · t\n\nWhere u = initial velocity, v = final velocity, a = acceleration, t = time, s = displacement.\n\n*Worked example:* a car starts at u = 0 and accelerates at a = 3 m/s² for t = 5 s.\nv = 0 + 3(5) = **15 m/s**, and s = 0 + ½(3)(5²) = **37.5 m**.\n\nTip: list what you know, pick the equation missing the quantity you don't need.`;
};

/* --------------------------- knowledge base ------------------------------- */

const knowledge: Array<{ match: RegExp; answer: string }> = [
  {
    match: /photosynth/i,
    answer:
      "**Photosynthesis** converts light energy into chemical energy:\n\n6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂\n\n• *Light-dependent reactions* (thylakoid membrane): water is split, ATP and NADPH are produced.\n• *Calvin cycle* (stroma): CO₂ is fixed into glucose using that ATP and NADPH.",
  },
  {
    match: /newton'?s (laws|law)/i,
    answer:
      "**Newton's three laws**\n\n1. *Inertia* — an object keeps its velocity unless a net force acts on it.\n2. *F = ma* — acceleration is proportional to net force and inversely proportional to mass.\n3. *Action–reaction* — forces come in equal and opposite pairs on different bodies.\n\nExam tip: always draw a free-body diagram before applying F = ma.",
  },
  {
    match: /pythagoras|pythagorean/i,
    answer:
      "**Pythagoras' theorem:** a² + b² = c² for a right-angled triangle, where c is the hypotenuse.\n\nExample: legs 3 and 4 → c = √(9 + 16) = √25 = **5**.",
  },
  {
    match: /quadratic/i,
    answer:
      "**Quadratic formula:** for ax² + bx + c = 0,\n\nx = (−b ± √(b² − 4ac)) / 2a\n\nThe discriminant b² − 4ac tells you the shape of the answer: positive → two real roots, zero → one repeated root, negative → complex roots.",
  },
  {
    match: /derivative|differentiat/i,
    answer:
      "**Differentiation basics**\n\n• Power rule: d/dx(xⁿ) = n·xⁿ⁻¹\n• Product rule: (uv)' = u'v + uv'\n• Quotient rule: (u/v)' = (u'v − uv') / v²\n• Chain rule: d/dx f(g(x)) = f'(g(x))·g'(x)\n\nExample: d/dx(3x⁴) = 12x³.",
  },
  {
    match: /integrat|integral/i,
    answer:
      "**Integration basics**\n\n• ∫xⁿ dx = xⁿ⁺¹/(n+1) + C (n ≠ −1)\n• ∫1/x dx = ln|x| + C\n• ∫eˣ dx = eˣ + C\n• By parts: ∫u dv = uv − ∫v du\n\nAlways add + C for indefinite integrals.",
  },
  {
    match: /periodic table|periodic trend/i,
    answer:
      "**Periodic trends** (left → right across a period): atomic radius decreases, ionisation energy increases, electronegativity increases.\n\nDown a group: radius increases, ionisation energy decreases, metallic character increases. The driver is effective nuclear charge versus shielding.",
  },
  {
    match: /mole|stoichiometr/i,
    answer:
      "**Stoichiometry workflow**\n\n1. Balance the equation.\n2. Convert grams → moles (n = m / M).\n3. Use the mole ratio from the balanced equation.\n4. Convert moles back to grams or litres (22.4 L/mol at STP).\n\nThe reactant that runs out first is the limiting reagent.",
  },
  {
    match: /procrastinat|focus|concentrat|motivat/i,
    answer:
      "**Beating procrastination**\n\n• Start with a 5-minute commitment — starting is the hard part.\n• Use the Pomodoro timer on your dashboard: 25 min focus / 5 min break.\n• Make the next action tiny and specific (\"open page 42\", not \"study physics\").\n• Put your phone in another room; friction beats willpower.",
  },
  {
    match: /study plan|revision|how (do|should) i study|time table|timetable/i,
    answer:
      "**A revision plan that works**\n\n1. List every syllabus topic in Exam Mastery and mark your confidence.\n2. Allocate the most hours to low-confidence, high-weight topics.\n3. Study in 25-minute focused blocks with active recall — close the book and write what you remember.\n4. Space repetition: revisit day 1, day 3, day 7, day 14.\n5. Finish with a past paper under timed conditions.",
  },
  {
    match: /essay|paragraph|write/i,
    answer:
      "**Essay structure**\n\n• *Intro:* context → thesis → roadmap.\n• *Body:* one idea per paragraph using PEEL — Point, Evidence, Explain, Link.\n• *Conclusion:* restate the thesis in new words and answer \"so what?\".\n\nEdit twice: once for argument, once for sentences.",
  },
];

/* --------------------------------- engine --------------------------------- */

const solvers: Solver[] = [kinematics, linearEquation, arithmetic];

export function tutorReply(question: string, studentName?: string): string {
  const q = question.trim();
  if (!q) return "Ask me anything — a maths problem, a science concept, or how to plan your revision.";

  if (/^(hi|hey|hello|salam|assalam|good (morning|evening))\b/i.test(q)) {
    return `Hi${studentName ? ` ${studentName}` : ""} 👋 I'm your Study Sync tutor. Ask me a maths problem (like \`12 * 8 + 4\` or \`3x + 5 = 20\`), a science concept, or for a revision plan.`;
  }

  for (const solver of solvers) {
    const answer = solver(q);
    if (answer) return answer;
  }

  for (const entry of knowledge) {
    if (entry.match.test(q)) return entry.answer;
  }

  return `Here's how I'd approach **"${q}"**:\n\n1. *Identify the topic* — which chapter or subject does this belong to? Add it in Exam Mastery so it's tracked.\n2. *Write down what you know* — the given values, definitions, or key terms.\n3. *Find the rule that links them* — a formula, law, or definition from your notes.\n4. *Solve one step at a time*, then sanity-check the units or magnitude.\n\nI can go deeper if you give me the numbers or the exact equation — for example \`v = u + at with u=0, a=3, t=5\`, \`2x + 7 = 19\`, or \"explain Newton's laws\".`;
}

export const tutorSuggestions = [
  "Explain the equations of motion",
  "Solve 4x + 7 = 31",
  "How should I study for exams?",
  "What is photosynthesis?",
];

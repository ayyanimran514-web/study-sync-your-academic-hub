import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BookOpenCheck, Bot, HeartPulse, Sparkles, Timer } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useProfile } from "@/lib/store";
import { Card } from "@/components/AppShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Study Sync — Focus, Syllabus & Routine for Students" },
      {
        name: "description",
        content:
          "Study Sync is a dark-mode student workspace with homework timers, syllabus tracking, routine reminders and an offline AI study tutor.",
      },
      { property: "og:title", content: "Study Sync — Focus, Syllabus & Routine for Students" },
      {
        property: "og:description",
        content:
          "Plan homework, track syllabus progress, keep your routine and ask the AI tutor — all in one student workspace.",
      },
    ],
  }),
  component: Welcome,
});

const HIGHLIGHTS = [
  { icon: Timer, title: "Focus timers", text: "Pomodoro-style sessions logged per task." },
  { icon: BookOpenCheck, title: "Exam mastery", text: "Syllabus topics with live completion." },
  { icon: HeartPulse, title: "Routine & health", text: "Prayer, exercise and daily reminders." },
  { icon: Bot, title: "AI study tutor", text: "Solves problems and explains concepts." },
];

function Welcome() {
  const navigate = useNavigate();
  const [, setProfile] = useProfile();
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("Grade 11");
  const [goalHours, setGoalHours] = useState(4);
  const [prayerReminders, setPrayerReminders] = useState(true);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setProfile({ name: name.trim(), grade, goalHours, prayerReminders });
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
      <section className="min-w-0">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Study Sync
        </span>
        <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">
          Your semester,
          <br />
          <span className="text-gradient">finally in sync.</span>
        </h1>
        <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
          One calm workspace for homework, syllabus progress, exam countdowns, your daily routine
          and a tutor that actually answers. Built for students who want to stop guessing what to
          study next.
        </p>

        <ul className="mt-7 grid gap-3 sm:grid-cols-2">
          {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="glass glass-hover flex gap-3 rounded-2xl p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="font-display text-sm font-bold">{title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <Card className="w-full">
        <h2 className="text-xl font-bold">Let&apos;s set you up</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything stays on this device — no account needed.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
          <label className="grid gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Your name
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ayesha"
              required
              className="w-full rounded-xl border border-input bg-secondary/50 px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/40"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Class / year
            </span>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full rounded-xl border border-input bg-secondary/50 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40"
            >
              {["Grade 9", "Grade 10", "Grade 11", "Grade 12", "University"].map((g) => (
                <option key={g} value={g} className="bg-popover">
                  {g}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1.5">
            <span className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Daily study goal
              <span className="text-primary">{goalHours} h</span>
            </span>
            <input
              type="range"
              min={1}
              max={10}
              value={goalHours}
              onChange={(e) => setGoalHours(Number(e.target.value))}
              className="w-full accent-[var(--primary)]"
            />
          </label>

          <label className="flex items-center justify-between gap-3 rounded-xl border border-border bg-secondary/40 px-4 py-3">
            <span className="min-w-0 text-sm font-semibold">Prayer reminders</span>
            <input
              type="checkbox"
              checked={prayerReminders}
              onChange={(e) => setPrayerReminders(e.target.checked)}
              className="h-5 w-5 shrink-0 accent-[var(--primary)]"
            />
          </label>

          <button
            type="submit"
            className="mt-1 w-full rounded-xl bg-gradient-primary px-5 py-3.5 font-display text-sm font-bold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:-translate-y-0.5 active:translate-y-0"
          >
            Enter Study Sync
          </button>
        </form>
      </Card>
    </div>
  );
}

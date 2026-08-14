import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bot,
  CalendarClock,
  Check,
  Flame,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AppShell, Card, PageHeader, ProgressBar } from "@/components/AppShell";
import {
  daysUntil,
  percent,
  subjectProgress,
  todayKey,
  uid,
  useDayLog,
  useHabits,
  useProfile,
  useSubjects,
  useTasks,
} from "@/lib/store";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Study Sync" },
      {
        name: "description",
        content:
          "Today's homework, focus timers, goal progress, exam countdowns and routine reminders in one student dashboard.",
      },
      { property: "og:title", content: "Dashboard — Study Sync" },
      {
        property: "og:description",
        content: "Track homework, focus time, exams and daily routine in Study Sync.",
      },
    ],
  }),
  component: Dashboard,
});

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function Dashboard() {
  const [profile] = useProfile();
  const [tasks, setTasks] = useTasks();
  const [subjects] = useSubjects();
  const [habits, setHabits] = useHabits();
  const [day, setDay] = useDayLog();

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("General");

  // reset the focus log when the day changes
  useEffect(() => {
    if (day.date !== todayKey()) setDay({ date: todayKey(), focusMinutes: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day.date]);

  const goalMinutes = (profile?.goalHours ?? 4) * 60;
  const doneTasks = tasks.filter((t) => t.done).length;
  const habitsDone = habits.filter((h) => h.done).length;

  const nextExams = useMemo(
    () =>
      [...subjects]
        .filter((s) => daysUntil(s.examDate) >= 0)
        .sort((a, b) => a.examDate.localeCompare(b.examDate))
        .slice(0, 3),
    [subjects],
  );

  const syllabusOverall = useMemo(() => {
    const all = subjects.flatMap((s) => s.topics);
    return percent(all.filter((t) => t.done).length, all.length);
  }, [subjects]);

  function addTask(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    setTasks((prev) => [{ id: uid(), title: title.trim(), subject, done: false, minutes: 0 }, ...prev]);
    setTitle("");
    toast.success("Task added to today's list");
  }

  const toggleTask = (id: string) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const removeTask = (id: string) => setTasks((prev) => prev.filter((t) => t.id !== id));

  const toggleHabit = (id: string) =>
    setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, done: !h.done } : h)));

  const logFocus = (taskId: string | null, minutes: number) => {
    setDay({ date: todayKey(), focusMinutes: day.focusMinutes + minutes });
    if (taskId) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, minutes: t.minutes + minutes } : t)),
      );
    }
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow={new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
        title={`${greeting()}, ${profile?.name ?? "student"}`}
        subtitle={`${tasks.length - doneTasks} task${tasks.length - doneTasks === 1 ? "" : "s"} left · ${habitsDone}/${habits.length} routine items done`}
        action={
          <Link
            to="/tutor"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:-translate-y-0.5"
          >
            <Bot className="h-4 w-4" /> Ask tutor
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3 lg:col-span-3">
          <Card hover>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Focus today
            </p>
            <p className="mt-1 font-display text-3xl font-extrabold">
              {Math.floor(day.focusMinutes / 60)}h {day.focusMinutes % 60}m
            </p>
            <div className="mt-3">
              <ProgressBar value={percent(day.focusMinutes, goalMinutes)} label="Daily goal" />
            </div>
          </Card>
          <Card hover>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Homework
            </p>
            <p className="mt-1 font-display text-3xl font-extrabold">
              {doneTasks}
              <span className="text-lg text-muted-foreground">/{tasks.length}</span>
            </p>
            <div className="mt-3">
              <ProgressBar value={percent(doneTasks, tasks.length)} label="Completed" />
            </div>
          </Card>
          <Card hover>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Syllabus
            </p>
            <p className="mt-1 font-display text-3xl font-extrabold">{syllabusOverall}%</p>
            <div className="mt-3">
              <ProgressBar value={syllabusOverall} label="All subjects" />
            </div>
          </Card>
        </div>

        {/* Tasks */}
        <Card className="lg:col-span-2">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <h2 className="truncate font-display text-lg font-bold">Today&apos;s homework</h2>
            <span className="shrink-0 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-bold text-primary">
              {tasks.length - doneTasks} open
            </span>
          </div>

          <form onSubmit={addTask} className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add a task…"
              className="w-full rounded-xl border border-input bg-secondary/50 px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/40"
            />
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="rounded-xl border border-input bg-secondary/50 px-3 py-2.5 text-sm outline-none focus:border-primary"
            >
              {["General", ...subjects.map((s) => s.name)].map((s) => (
                <option key={s} value={s} className="bg-popover">
                  {s}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary/20 px-4 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-primary/30"
            >
              <Plus className="h-4 w-4" /> Add
            </button>
          </form>

          <ul className="mt-4 grid gap-2">
            {tasks.length === 0 && (
              <li className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
                Nothing due — add your first task above.
              </li>
            )}
            {tasks.map((task) => (
              <li
                key={task.id}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-secondary/35 px-3 py-3 transition-colors hover:border-primary/40"
              >
                <button
                  onClick={() => toggleTask(task.id)}
                  aria-label={task.done ? "Mark as not done" : "Mark as done"}
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg border transition-colors ${
                    task.done
                      ? "border-transparent bg-gradient-primary text-primary-foreground"
                      : "border-border hover:border-primary"
                  }`}
                >
                  {task.done && <Check className="h-3.5 w-3.5" />}
                </button>
                <div className="min-w-0">
                  <p
                    className={`truncate text-sm font-semibold ${task.done ? "text-muted-foreground line-through" : ""}`}
                  >
                    {task.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {task.subject}
                    {task.minutes > 0 && ` · ${task.minutes} min focused`}
                  </p>
                </div>
                <button
                  onClick={() => removeTask(task.id)}
                  aria-label="Delete task"
                  className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </Card>

        {/* Timer */}
        <FocusTimer
          tasks={tasks.filter((t) => !t.done).map((t) => ({ id: t.id, title: t.title }))}
          onComplete={logFocus}
        />

        {/* Exams */}
        <Card className="lg:col-span-2">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <h2 className="truncate font-display text-lg font-bold">Upcoming exams</h2>
            <Link to="/exams" className="shrink-0 text-xs font-bold text-primary hover:underline">
              Manage syllabus
            </Link>
          </div>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {nextExams.length === 0 && (
              <li className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground sm:col-span-3">
                No exams scheduled yet.
              </li>
            )}
            {nextExams.map((s) => (
              <li key={s.id} className="rounded-xl border border-border bg-secondary/35 p-3.5">
                <div className="flex items-center gap-2 text-xs font-bold text-primary">
                  <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                  <span>in {daysUntil(s.examDate)} days</span>
                </div>
                <p className="mt-1.5 truncate font-display font-bold">{s.name}</p>
                <div className="mt-3">
                  <ProgressBar value={subjectProgress(s)} label="Syllabus" />
                </div>
              </li>
            ))}
          </ul>
        </Card>

        {/* Reminders */}
        <Card>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <h2 className="truncate font-display text-lg font-bold">Health & prayer</h2>
            <Link to="/routine" className="shrink-0 text-xs font-bold text-primary hover:underline">
              All
            </Link>
          </div>
          <ul className="mt-4 grid gap-2">
            {habits.slice(0, 5).map((h) => (
              <li key={h.id}>
                <button
                  onClick={() => toggleHabit(h.id)}
                  className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-secondary/35 px-3 py-2.5 text-left transition-colors hover:border-primary/40"
                >
                  <span
                    className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${
                      h.done ? "border-transparent bg-gradient-primary" : "border-border"
                    }`}
                  >
                    {h.done && <Check className="h-3 w-3 text-primary-foreground" />}
                  </span>
                  <span
                    className={`truncate text-sm font-semibold ${h.done ? "text-muted-foreground line-through" : ""}`}
                  >
                    {h.title}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{h.time}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2.5 text-xs font-semibold text-primary">
            <Flame className="h-4 w-4 shrink-0" />
            <span className="min-w-0">
              {percent(habitsDone, habits.length)}% of today&apos;s routine complete
            </span>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

/* -------------------------------- timer ---------------------------------- */

const PRESETS = [25, 15, 45];

function FocusTimer({
  tasks,
  onComplete,
}: {
  tasks: Array<{ id: string; title: string }>;
  onComplete: (taskId: string | null, minutes: number) => void;
}) {
  const [minutes, setMinutes] = useState(25);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [taskId, setTaskId] = useState<string>("");
  const finished = useRef(false);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (remaining === 0 && running && !finished.current) {
      finished.current = true;
      setRunning(false);
      onComplete(taskId || null, minutes);
      toast.success(`Session complete — ${minutes} minutes logged 🎉`, {
        description: "Take a 5 minute break, then start the next block.",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, running]);

  function choose(preset: number) {
    setMinutes(preset);
    setRemaining(preset * 60);
    setRunning(false);
    finished.current = false;
  }

  function reset() {
    setRemaining(minutes * 60);
    setRunning(false);
    finished.current = false;
  }

  const progress = 100 - Math.round((remaining / (minutes * 60)) * 100);
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <Card>
      <h2 className="font-display text-lg font-bold">Homework timer</h2>
      <p className="mt-1 text-xs text-muted-foreground">Focus in blocks, log the time to a task.</p>

      <p className="mt-4 text-center font-display text-5xl font-extrabold tabular-nums tracking-tight">
        {mm}:{ss}
      </p>
      <div className="mt-3">
        <ProgressBar value={progress} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => choose(p)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              minutes === p
                ? "bg-primary/20 text-primary"
                : "bg-secondary/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            {p} min
          </button>
        ))}
      </div>

      <select
        value={taskId}
        onChange={(e) => setTaskId(e.target.value)}
        className="mt-3 w-full rounded-xl border border-input bg-secondary/50 px-3 py-2.5 text-sm outline-none focus:border-primary"
      >
        <option value="" className="bg-popover">
          General study
        </option>
        {tasks.map((t) => (
          <option key={t.id} value={t.id} className="bg-popover">
            {t.title}
          </option>
        ))}
      </select>

      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <button
          onClick={() => {
            finished.current = false;
            setRunning((r) => !r);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:-translate-y-0.5"
        >
          {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {running ? "Pause" : "Start focus"}
        </button>
        <button
          onClick={reset}
          aria-label="Reset timer"
          className="rounded-xl border border-border bg-secondary/50 px-4 text-muted-foreground transition-colors hover:text-foreground"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </Card>
  );
}

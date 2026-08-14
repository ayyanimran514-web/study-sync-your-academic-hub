import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, Check, Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AppShell, Card, PageHeader, ProgressBar } from "@/components/AppShell";
import { daysUntil, subjectProgress, uid, useSubjects, type Subject } from "@/lib/store";

export const Route = createFileRoute("/exams")({
  head: () => ({
    meta: [
      { title: "Exam Mastery — Study Sync" },
      {
        name: "description",
        content:
          "Add subjects, break the syllabus into topics, track completion percentage and allocate study hours before every exam.",
      },
      { property: "og:title", content: "Exam Mastery — Study Sync" },
      {
        property: "og:description",
        content: "Syllabus tracking, subject progress and exam countdowns for students.",
      },
    ],
  }),
  component: Exams,
});

function Exams() {
  const [subjects, setSubjects] = useSubjects();
  const [name, setName] = useState("");
  const [examDate, setExamDate] = useState("");

  function addSubject(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !examDate) return;
    setSubjects((prev) => [
      ...prev,
      { id: uid(), name: name.trim(), examDate, allocatedHours: 4, topics: [] },
    ]);
    setName("");
    setExamDate("");
    toast.success("Subject added");
  }

  const update = (id: string, patch: Partial<Subject>) =>
    setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const totalHours = subjects.reduce((sum, s) => sum + s.allocatedHours, 0);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Exam mastery"
        title="Syllabus & subjects"
        subtitle={`${subjects.length} subjects · ${totalHours}h allocated this week`}
      />

      <Card className="mb-4">
        <form onSubmit={addSubject} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Subject name (e.g. Biology)"
            className="w-full rounded-xl border border-input bg-secondary/50 px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/40"
          />
          <input
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            className="rounded-xl border border-input bg-secondary/50 px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" /> Add subject
          </button>
        </form>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {subjects.map((subject) => (
          <SubjectCard
            key={subject.id}
            subject={subject}
            onUpdate={(patch) => update(subject.id, patch)}
            onRemove={() => setSubjects((prev) => prev.filter((s) => s.id !== subject.id))}
          />
        ))}
        {subjects.length === 0 && (
          <Card className="lg:col-span-2">
            <p className="py-8 text-center text-sm text-muted-foreground">
              No subjects yet — add one above to start tracking your syllabus.
            </p>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

function SubjectCard({
  subject,
  onUpdate,
  onRemove,
}: {
  subject: Subject;
  onUpdate: (patch: Partial<Subject>) => void;
  onRemove: () => void;
}) {
  const [topic, setTopic] = useState("");
  const progress = subjectProgress(subject);
  const days = daysUntil(subject.examDate);

  function addTopic(event: FormEvent) {
    event.preventDefault();
    if (!topic.trim()) return;
    onUpdate({ topics: [...subject.topics, { id: uid(), title: topic.trim(), done: false }] });
    setTopic("");
  }

  const toggleTopic = (id: string) =>
    onUpdate({
      topics: subject.topics.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    });

  return (
    <Card hover>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <h2 className="truncate font-display text-lg font-bold">{subject.name}</h2>
          <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-primary">
            <CalendarClock className="h-3.5 w-3.5 shrink-0" />
            {days >= 0 ? `Exam in ${days} day${days === 1 ? "" : "s"}` : "Exam passed"} ·{" "}
            {subject.examDate}
          </p>
        </div>
        <button
          onClick={onRemove}
          aria-label={`Delete ${subject.name}`}
          className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4">
        <ProgressBar value={progress} label="Syllabus completion" />
      </div>

      <label className="mt-4 grid gap-1.5">
        <span className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Weekly study time
          <span className="text-primary">{subject.allocatedHours} h</span>
        </span>
        <input
          type="range"
          min={0}
          max={20}
          value={subject.allocatedHours}
          onChange={(e) => onUpdate({ allocatedHours: Number(e.target.value) })}
          className="w-full accent-[var(--primary)]"
        />
      </label>

      <ul className="mt-4 grid gap-2">
        {subject.topics.map((t) => (
          <li key={t.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
            <button
              onClick={() => toggleTopic(t.id)}
              aria-label={t.done ? "Mark topic unfinished" : "Mark topic finished"}
              className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors ${
                t.done ? "border-transparent bg-gradient-primary" : "border-border hover:border-primary"
              }`}
            >
              {t.done && <Check className="h-3 w-3 text-primary-foreground" />}
            </button>
            <span
              className={`truncate text-sm ${t.done ? "text-muted-foreground line-through" : ""}`}
            >
              {t.title}
            </span>
            <button
              onClick={() => onUpdate({ topics: subject.topics.filter((x) => x.id !== t.id) })}
              aria-label="Remove topic"
              className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={addTopic} className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Add syllabus topic…"
          className="w-full rounded-xl border border-input bg-secondary/50 px-3.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
        />
        <button
          type="submit"
          className="rounded-xl bg-primary/20 px-3 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/30"
        >
          <Plus className="h-4 w-4" />
        </button>
      </form>
    </Card>
  );
}

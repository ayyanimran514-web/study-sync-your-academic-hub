import { useCallback, useEffect, useState } from "react";

/* ---------------------------------- types --------------------------------- */

export type Profile = {
  name: string;
  grade: string;
  goalHours: number;
  prayerReminders: boolean;
};

export type Task = {
  id: string;
  title: string;
  subject: string;
  done: boolean;
  minutes: number; // focused minutes logged
};

export type Topic = { id: string; title: string; done: boolean };

export type Subject = {
  id: string;
  name: string;
  examDate: string; // yyyy-mm-dd
  allocatedHours: number;
  topics: Topic[];
};

export type Habit = {
  id: string;
  title: string;
  kind: "routine" | "exercise" | "prayer" | "custom";
  time: string; // HH:mm
  done: boolean;
};

export type ChatMessage = { id: string; role: "user" | "tutor"; text: string };

/* --------------------------------- helpers -------------------------------- */

export const uid = () => Math.random().toString(36).slice(2, 10);
export const todayKey = () => new Date().toISOString().slice(0, 10);

const KEYS = {
  profile: "studysync.profile",
  tasks: "studysync.tasks",
  subjects: "studysync.subjects",
  habits: "studysync.habits",
  chat: "studysync.chat",
  day: "studysync.day",
} as const;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/** localStorage-backed state that stays SSR-safe (hydrates after mount). */
export function useStored<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setValue(read<T>(key, initial));
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          /* storage unavailable — keep in-memory state */
        }
        return resolved;
      });
    },
    [key],
  );

  return [value, update, ready] as const;
}

/* ------------------------------- domain hooks ------------------------------ */

export const defaultTasks: Task[] = [
  { id: uid(), title: "Calculus problem set 4", subject: "Mathematics", done: false, minutes: 0 },
  { id: uid(), title: "Read Physics ch. 7 — Motion", subject: "Physics", done: false, minutes: 0 },
  { id: uid(), title: "Chemistry lab report", subject: "Chemistry", done: true, minutes: 45 },
];

export const defaultSubjects: Subject[] = [
  {
    id: uid(),
    name: "Mathematics",
    examDate: inDays(9),
    allocatedHours: 8,
    topics: [
      { id: uid(), title: "Limits & continuity", done: true },
      { id: uid(), title: "Differentiation rules", done: true },
      { id: uid(), title: "Integration by parts", done: false },
      { id: uid(), title: "Series & sequences", done: false },
    ],
  },
  {
    id: uid(),
    name: "Physics",
    examDate: inDays(14),
    allocatedHours: 6,
    topics: [
      { id: uid(), title: "Equations of motion", done: true },
      { id: uid(), title: "Newton's laws", done: false },
      { id: uid(), title: "Work, energy & power", done: false },
    ],
  },
  {
    id: uid(),
    name: "Chemistry",
    examDate: inDays(21),
    allocatedHours: 4,
    topics: [
      { id: uid(), title: "Periodic trends", done: true },
      { id: uid(), title: "Stoichiometry", done: true },
      { id: uid(), title: "Organic nomenclature", done: false },
    ],
  },
];

export const defaultHabits: Habit[] = [
  { id: uid(), title: "Fajr", kind: "prayer", time: "05:10", done: true },
  { id: uid(), title: "Drink 2L water", kind: "routine", time: "09:00", done: false },
  { id: uid(), title: "20 push-ups challenge", kind: "exercise", time: "17:30", done: false },
  { id: uid(), title: "Maghrib", kind: "prayer", time: "18:45", done: false },
  { id: uid(), title: "Sleep by 11 PM", kind: "routine", time: "23:00", done: false },
];

function inDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export const useProfile = () => useStored<Profile | null>(KEYS.profile, null);
export const useTasks = () => useStored<Task[]>(KEYS.tasks, defaultTasks);
export const useSubjects = () => useStored<Subject[]>(KEYS.subjects, defaultSubjects);
export const useHabits = () => useStored<Habit[]>(KEYS.habits, defaultHabits);
export const useChat = () => useStored<ChatMessage[]>(KEYS.chat, []);
export const useDayLog = () =>
  useStored<{ date: string; focusMinutes: number }>(KEYS.day, {
    date: todayKey(),
    focusMinutes: 0,
  });

/* --------------------------------- derived -------------------------------- */

export const subjectProgress = (s: Subject) =>
  s.topics.length ? Math.round((s.topics.filter((t) => t.done).length / s.topics.length) * 100) : 0;

export const daysUntil = (date: string) =>
  Math.ceil((new Date(date + "T00:00:00").getTime() - Date.now()) / 86_400_000);

export const percent = (done: number, total: number) =>
  total ? Math.round((done / total) * 100) : 0;

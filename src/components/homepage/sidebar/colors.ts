// Simple helper to return a random Tailwind background color class.
// Kept intentionally small and deterministic per call; the component
// will memoize the result per-commit to keep colors stable across re-renders.
const COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-yellow-400",
  "bg-pink-500",
  "bg-red-500",
  "bg-indigo-500",
];

export default function getRandomColorClass(): string {
  const idx = Math.floor(Math.random() * COLORS.length);
  return COLORS[idx];
}

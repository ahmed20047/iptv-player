"use client";

import { Category } from "./types";
import { useLang } from "@/lib/i18n";

export function CategoryChips({
  categories,
  value,
  onChange,
}: {
  categories: Category[];
  value: string;
  onChange: (v: string) => void;
}) {
  const { t } = useLang();
  return (
    <div className="flex flex-wrap gap-2">
      <Chip active={value === "all"} onClick={() => onChange("all")}>
        {t("common.all")}
      </Chip>
      {categories.map((c) => (
        <Chip
          key={c.id}
          active={value === c.id}
          onClick={() => onChange(c.id)}
        >
          {c.name}
        </Chip>
      ))}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
        active
          ? "bg-gradient-to-l from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-950/50"
          : "bg-gray-900/60 text-gray-300 ring-1 ring-gray-800 hover:bg-gray-800"
      }`}
    >
      {children}
    </button>
  );
}

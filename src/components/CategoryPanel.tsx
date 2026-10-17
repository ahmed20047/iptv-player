"use client";

import { Category } from "./types";
import { useLang } from "@/lib/i18n";

// قائمة التصنيفات الجنبية — بتظهر على اليمين في العربي (أول عنصر في الـ RTL)
export default function CategoryPanel({
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
    <aside className="sticky top-24 max-h-[calc(100vh-8rem)] w-52 shrink-0 self-start overflow-y-auto rounded-2xl border border-gray-800/80 bg-gray-900/40 p-2.5 backdrop-blur">
      <p className="px-3 pb-2 pt-1 text-xs font-bold tracking-wide text-gray-500">
        {t("panel.categories")}
      </p>
      <Item active={value === "all"} onClick={() => onChange("all")}>
        {t("common.all")}
      </Item>
      {categories.map((c) => (
        <Item
          key={c.id}
          active={value === c.id}
          onClick={() => onChange(c.id)}
          title={c.name}
        >
          {c.name}
        </Item>
      ))}
    </aside>
  );
}

function Item({
  active,
  onClick,
  children,
  title,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`relative block w-full truncate rounded-xl px-3 py-2 text-start text-sm transition ${
        active
          ? "bg-emerald-500/15 font-bold text-emerald-300"
          : "text-gray-400 hover:bg-gray-800/60 hover:text-gray-200"
      }`}
    >
      {active && (
        <span className="absolute inset-y-2 start-0 w-0.5 rounded-full bg-emerald-400" />
      )}
      {children}
    </button>
  );
}

"use client";

import { Fragment } from "react";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from "@headlessui/react";
import { ChevronDown } from "lucide-react";

export const BUDGET_OPTIONS = ["Por definir", "Menos de $10M COP", "Más de $10M COP"];
export const BUDGET_PLACEHOLDER = "Selecciona un rango";

export default function BudgetSelect({ value, onChange }) {
  return (
    <Listbox value={value} onChange={onChange}>
      {({ open }) => (
        <div className="relative">
          <ListboxButton className="flex w-full items-center justify-between gap-3 border-b border-(--home-line) bg-transparent py-3 text-left text-white outline-none focus:border-(--home-lime)">
            <span className={value ? "text-white" : "text-(--home-muted)"}>{value || BUDGET_PLACEHOLDER}</span>
            <ChevronDown aria-hidden="true" className={`h-[15px] w-[15px] shrink-0 text-(--home-muted) transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
          </ListboxButton>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-75"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <ListboxOptions className="absolute left-0 top-full z-50 max-h-60 w-full overflow-y-auto border border-(--home-line) bg-(--home-card) py-1 shadow-[0_22px_50px_#08050c88]">
              {BUDGET_OPTIONS.map((opt) => (
                <ListboxOption
                  key={opt}
                  value={opt}
                  className="cursor-pointer px-4 py-3 text-sm text-(--home-muted) outline-none data-focus:bg-white/5 data-focus:text-white data-selected:font-medium data-selected:text-(--home-lime)"
                >
                  {opt}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </Transition>
        </div>
      )}
    </Listbox>
  );
}

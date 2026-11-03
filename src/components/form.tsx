"use client";

import { useState, type ReactNode } from "react";
import { ChevronsUpDown } from "lucide-react";

export function FormGroup({ children }: { children: ReactNode }) {
  return <div className="separated overflow-hidden rounded-[12px] bg-group">{children}</div>;
}

export function GroupLabel({ children }: { children: ReactNode }) {
  return <p className="mb-1.5 px-4 text-[13px] uppercase tracking-[0.02em] text-dim">{children}</p>;
}

export function Section({ label, children }: { label?: ReactNode; children: ReactNode }) {
  return (
    <div>
      {label ? <GroupLabel>{label}</GroupLabel> : null}
      <FormGroup>{children}</FormGroup>
    </div>
  );
}

export function TextRow({
  name,
  placeholder,
  defaultValue,
  required = false,
  maxLength = 200,
  inputMode,
  autoFocus,
}: {
  name: string;
  placeholder: string;
  defaultValue?: string | null;
  required?: boolean;
  maxLength?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoFocus?: boolean;
}) {
  return (
    <label className="flex h-12 items-center px-4">
      <input
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
        maxLength={maxLength}
        placeholder={placeholder}
        aria-label={placeholder}
        inputMode={inputMode}
        autoFocus={autoFocus}
        className="input"
      />
    </label>
  );
}

export function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex min-h-12 items-center justify-between gap-3 px-4">
      <span className="shrink-0 text-[17px]">{label}</span>
      <span className="flex min-w-0 flex-1 justify-end text-right">{children}</span>
    </label>
  );
}

export function InputRow({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
  required = false,
  inputMode,
}: {
  label: string;
  name: string;
  type?: "text" | "date" | "time" | "url";
  defaultValue?: string | number | null;
  placeholder?: string;
  required?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <FieldRow label={label}>
      <input
        name={name}
        type={type === "url" ? "text" : type}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        required={required}
        inputMode={type === "url" ? "url" : inputMode}
        autoCapitalize={type === "url" ? "off" : undefined}
        autoCorrect={type === "url" ? "off" : undefined}
        className={`input text-right ${type === "date" || type === "time" ? "text-accent" : ""}`}
      />
    </FieldRow>
  );
}

export function SelectRow({
  label,
  name,
  options,
  defaultValue,
  allowEmpty,
}: {
  label: string;
  name: string;
  options: readonly (readonly [string, string])[];
  defaultValue?: string | null;
  allowEmpty?: string;
}) {
  return (
    <FieldRow label={label}>
      <span className="flex items-center gap-1 text-dim">
        <select
          name={name}
          defaultValue={defaultValue ?? ""}
          className="input cursor-pointer appearance-none text-right text-dim"
          style={{ textAlignLast: "right" }}
        >
          {allowEmpty !== undefined ? <option value="">{allowEmpty}</option> : null}
          {options.map(([value, text]) => (
            <option key={value} value={value}>
              {text}
            </option>
          ))}
        </select>
        <ChevronsUpDown className="h-4 w-4 shrink-0" />
      </span>
    </FieldRow>
  );
}

export function ToggleRow({
  label,
  name,
  defaultChecked,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex h-12 cursor-pointer items-center justify-between gap-3 px-4">
      <span className="text-[17px]">{label}</span>
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="peer sr-only"
      />
      <span className="relative h-[31px] w-[51px] shrink-0 rounded-full bg-fill transition-colors peer-checked:bg-good peer-focus-visible:outline-2 peer-focus-visible:outline-accent after:absolute after:left-[2px] after:top-[2px] after:h-[27px] after:w-[27px] after:rounded-full after:bg-white after:shadow-[0_3px_8px_rgb(0_0_0/0.15)] after:transition-transform peer-checked:after:translate-x-5" />
    </label>
  );
}

export function NotesField({
  name,
  defaultValue,
  placeholder,
  label = "Notes",
}: {
  name: string;
  defaultValue?: string | null;
  placeholder: string;
  label?: string;
}) {
  return (
    <div>
      <GroupLabel>{label}</GroupLabel>
      <div className="rounded-[12px] bg-group px-4 py-3">
        <textarea
          name={name}
          defaultValue={defaultValue ?? ""}
          rows={3}
          placeholder={placeholder}
          className="input resize-none leading-snug"
        />
      </div>
    </div>
  );
}

export function ChoiceChips<T extends string>({
  name,
  options,
  defaultValue,
  colorOf,
  iconOf,
}: {
  name: string;
  options: readonly (readonly [T, string])[];
  defaultValue: T;
  colorOf?: (value: T) => string;
  iconOf?: (value: T) => ReactNode;
}) {
  const [value, setValue] = useState<T>(defaultValue);
  return (
    <div className="flex flex-wrap gap-2">
      <input type="hidden" name={name} value={value} />
      {options.map(([option, text]) => {
        const active = option === value;
        const color = colorOf?.(option);
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => setValue(option)}
            className={`pressable flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[15px] font-semibold transition-colors ${
              active ? "text-white" : "bg-group text-dim"
            }`}
            style={active ? { backgroundColor: color ?? "var(--color-accent)" } : undefined}
          >
            {iconOf?.(option)}
            {text}
          </button>
        );
      })}
    </div>
  );
}

export function CityField({
  cities,
  defaultValue,
  required = false,
}: {
  cities: { id: string; name: string; color: string }[];
  defaultValue?: string | null;
  required?: boolean;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const listId = "city-suggestions";
  return (
    <div>
      <GroupLabel>City</GroupLabel>
      <FormGroup>
        <label className="flex h-12 items-center px-4">
          <input
            name="city"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            list={listId}
            required={required}
            maxLength={60}
            placeholder={required ? "Tokyo, Kyoto, Osaka…" : "Optional — Tokyo, Kyoto…"}
            aria-label="City"
            autoComplete="off"
            className="input"
          />
        </label>
      </FormGroup>
      <datalist id={listId}>
        {cities.map((city) => (
          <option key={city.id} value={city.name} />
        ))}
      </datalist>
      {cities.length > 0 ? (
        <div className="no-scrollbar -mx-4 mt-2 flex gap-1.5 overflow-x-auto px-4">
          {cities.map((city) => {
            const active = city.name.toLowerCase() === value.trim().toLowerCase();
            return (
              <button
                key={city.id}
                type="button"
                onClick={() => setValue(active ? "" : city.name)}
                className="pressable flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[14px] font-semibold"
                style={{
                  color: active ? "#fff" : city.color,
                  backgroundColor: active ? city.color : `${city.color}22`,
                }}
              >
                {city.name}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function DangerButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="pressable h-12 w-full rounded-[12px] bg-group text-[17px] text-bad disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export function SectionNote({ children }: { children: ReactNode }) {
  return <p className="px-4 text-[13px] leading-snug text-dim">{children}</p>;
}

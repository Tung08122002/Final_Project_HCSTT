import { useRef, type InputHTMLAttributes } from "react";
import { formatMoneyInput, parseMoneyInput } from "../services/api";

type Props = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type"
> & {
  value: number | null | undefined;
  onValueChange: (value: number | null) => void;
};

export function MoneyInput({ value, onValueChange, ...props }: Props) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <input
      {...props}
      ref={input}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={formatMoneyInput(value)}
      onChange={(event) => {
        const typed = event.currentTarget.value;
        const next = parseMoneyInput(typed);
        const formatted = formatMoneyInput(next);
        const digitsBeforeCursor = typed
          .slice(0, event.currentTarget.selectionStart ?? typed.length)
          .replace(/[^0-9]/g, "").length;
        event.currentTarget.value = formatted;
        onValueChange(next);
        requestAnimationFrame(() => {
          const field = input.current;
          if (!field || document.activeElement !== field) return;
          let position = 0;
          let digits = 0;
          while (position < formatted.length && digits < digitsBeforeCursor) {
            if (/[0-9]/.test(formatted[position])) digits++;
            position++;
          }
          field.setSelectionRange(position, position);
        });
      }}
    />
  );
}

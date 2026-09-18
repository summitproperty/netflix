"use client";

import { useFormStatus } from "react-dom";

import { SpinnerIcon } from "@/components/ui/Icons";
import { cn } from "@/lib/utils/cn";

interface SubmitButtonProps {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "secondary";
  className?: string;
}

/**
 * Submit button wired to the enclosing form's pending state, so every auth form
 * gets a disabled + spinner state without extra bookkeeping.
 */
export function SubmitButton({
  children,
  pendingLabel = "Please wait",
  variant = "primary",
  className,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={cn(
        variant === "primary" ? "btn-primary" : "btn-secondary",
        "w-full",
        className,
      )}
    >
      {pending ? <SpinnerIcon width={16} height={16} /> : null}
      {pending ? pendingLabel : children}
    </button>
  );
}

export default SubmitButton;

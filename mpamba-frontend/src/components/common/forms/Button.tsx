import * as React from "react";

import { Button as UiButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ButtonProps = Omit<React.ComponentProps<typeof UiButton>, "children"> & {
    text?: React.ReactNode;
    children?: React.ReactNode;
    icon?: React.ReactNode;
    iconPosition?: "start" | "end";
    isLoading?: boolean;
    loadingText?: React.ReactNode;
    fullWidth?: boolean;
};

export default function FormButton({
    text,
    children,
    icon,
    iconPosition = "start",
    isLoading = false,
    loadingText = "",
    fullWidth = true,
    className,
    disabled,
    variant,
    size,
    ...props
}: ButtonProps) {
    const content = children ?? text;

    return (
        <UiButton
            variant={variant}
            size={size}
            className={cn(
                "h-11 rounded-sm gradient-brand px-4 py-2 text-sm font-bold tracking-wide text-white transition-all duration-300 hover:scale-[0.98] hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100 disabled:hover:brightness-100 cursor-pointer",
                fullWidth && "w-full",
                className
            )}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <span className="inline-flex items-center justify-center gap-1.5">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                    {loadingText}
                </span>
            ) : (
                <span className="inline-flex items-center justify-center gap-1.5">
                    {icon && iconPosition === "start" ? <span aria-hidden="true">{icon}</span> : null}
                    {content}
                    {icon && iconPosition === "end" ? <span aria-hidden="true">{icon}</span> : null}
                </span>
            )}
        </UiButton>
    );
}
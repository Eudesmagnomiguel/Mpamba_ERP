import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { Input as UiInput } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type InputProps = React.ComponentProps<typeof UiInput> & {
    label?: React.ReactNode;
    error?: string;
    helperText?: React.ReactNode;
    icon?: React.ReactNode;
    rightElement?: React.ReactNode;
    showPasswordToggle?: boolean;
    wrapperClassName?: string;
    labelClassName?: string;
};

export default function FormInput({
    label,
    error,
    helperText,
    icon,
    rightElement,
    showPasswordToggle = false,
    wrapperClassName,
    labelClassName,
    className,
    id,
    type,
    disabled,
    ...props
}: InputProps) {
    const inputId = id ?? React.useId();
    const hasError = Boolean(error);
    const [showPassword, setShowPassword] = React.useState(false);
    
    const inputType = showPasswordToggle && showPassword ? "text" : type;
    const finalRightElement = showPasswordToggle ? (
        <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            disabled={disabled}
        >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
    ) : (
        rightElement
    );

    return (
        <div className={cn("space-y-1.5", wrapperClassName)}>
            {label ? (
                <label htmlFor={inputId} className={cn("block text-xs font-bold text-foreground", labelClassName)}>
                    {label}
                </label>
            ) : null}

            <div className="relative group">
                {icon ? (
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                        <span className={cn("text-slate-400 transition-colors duration-300 group-focus-within:text-primary", hasError && "text-red-500")}>{icon}</span>
                    </div>
                ) : null}
                <UiInput
                    id={inputId}
                    type={inputType}
                    aria-invalid={hasError || props["aria-invalid"]}
                    disabled={disabled}
                    className={cn(
                        "block h-11 w-full rounded-sm border bg-slate-50 px-4 text-sm font-medium text-foreground placeholder:text-slate-400 transition-all duration-300 focus:bg-white focus:outline-none [&:focus-visible]:ring-0",
                        icon && "pl-11",
                        finalRightElement && "pr-12",
                        hasError
                            ? "border-red-500 focus:border-red-500 [&:focus-visible]:border-red-500"
                            : "border-gray-200 hover:border-gray-300 focus:border-gray-300 [&:focus-visible]:border-gray-300",
                        className
                    )}
                    {...props}
                />
                {finalRightElement ? (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 transition-colors duration-300 hover:text-primary">
                        {finalRightElement}
                    </span>
                ) : null}
            </div>

            {error ? (
                <p className="ml-2 mt-0.5 flex items-center gap-1 text-xs font-semibold text-red-600">
                    <span>●</span> {error}
                </p>
            ) : helperText ? (
                <p className="text-sm text-muted-foreground">{helperText}</p>
            ) : null}
        </div>
    );
}
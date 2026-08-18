import * as React from "react";
import { 
    Select as UiSelect, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type SelectOption = {
    value: string;
    label: string;
};

type SelectProps = React.ComponentProps<typeof UiSelect> & {
    label?: React.ReactNode;
    error?: string;
    helperText?: React.ReactNode;
    wrapperClassName?: string;
    labelClassName?: string;
    className?: string;
    placeholder?: string;
    options?: SelectOption[];
    onChange?: (value: string) => void;
};

export default function FormSelect({
    label,
    error,
    helperText,
    wrapperClassName,
    labelClassName,
    children,
    className,
    placeholder,
    options,
    onValueChange,
    onChange,
    ...props
}: SelectProps) {
    const hasError = Boolean(error);
    const handleValueChange = onValueChange || onChange;

    return (
        <div className={cn("space-y-1.5", wrapperClassName)}>
            {label ? (
                <label className={cn("block text-xs font-bold text-primary", labelClassName)}>
                    {label}
                </label>
            ) : null}

            <div className="relative">
                <UiSelect onValueChange={handleValueChange} {...props}>
                    {children ? (
                        children
                    ) : (
                        <>
                            <SelectTrigger className={cn("w-full bg-white border-slate-200 rounded-sm h-11 text-sm", className)}>
                                <SelectValue placeholder={placeholder} />
                            </SelectTrigger>
                            <SelectContent className="rounded-sm shadow-xl border-slate-200">
                                {options?.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </>
                    )}
                </UiSelect>
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
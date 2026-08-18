import React, { FC } from "react";
import { Layout, Building, User } from "lucide-react";

type Step = {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
};

interface Props {
  current: string;
  steps?: Step[];
}

const defaultSteps: Step[] = [
  { id: "module", label: "Plano", icon: Layout },
  { id: "organization", label: "Empresa", icon: Building },
  { id: "admin", label: "Admin", icon: User }
];

const ProgressIndicator: FC<Props> = ({ current, steps = defaultSteps }) => {
  const currentIndex = steps.findIndex((s) => s.id === current);

  return (
    <div className="flex items-center justify-center gap-2 mb-1">
      {steps.map((s, idx) => {
        const Icon = s.icon;
        const isActive = idx === currentIndex;
        const isDone = idx < currentIndex;

        return (
          <div key={s.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-sm flex items-center justify-center transition-all duration-300 border text-sm font-bold ${
                  isActive
                    ? "bg-primary border-primary text-white"
                    : isDone
                    ? "bg-green-500 border-green-500 text-white"
                    : "bg-gray-100 border-gray-200 text-slate-400"
                }`}
              >
                {isDone ? "✓" : <Icon size={18} />}
              </div>
              <span
                className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 ${
                  isActive ? "text-primary" : "text-gray-400"
                }`}
              >
                {s.label}
              </span>
            </div>

            {idx < steps.length - 1 && (
              <div
                className={`w-6 h-0.5 mx-1 ${
                  idx < currentIndex ? "bg-green-500" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ProgressIndicator;

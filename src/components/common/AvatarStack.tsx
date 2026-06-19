import { cn } from "@/lib/utils";

interface AvatarStackProps {
  names: string[];
  max?: number;
  size?: "sm" | "md";
  className?: string;
}

export function AvatarStack({ names, max = 3, size = "sm", className }: AvatarStackProps) {
  const shown = names.slice(0, max);
  const overflow = names.length - max;
  const sizeClass = size === "sm" ? "w-6 h-6 text-[9px]" : "w-8 h-8 text-xs";

  return (
    <div className={cn("flex items-center", className)}>
      {shown.map((name, i) => (
        <div
          key={i}
          title={name}
          className={cn(
            "rounded-full gradient-brand flex items-center justify-center font-bold text-black border-2 border-card",
            sizeClass,
            i > 0 && "-ms-1.5"
          )}
        >
          {name.slice(0, 1)}
        </div>
      ))}
      {overflow > 0 && (
        <div
          className={cn(
            "rounded-full bg-muted border-2 border-card flex items-center justify-center font-medium text-muted-foreground -ms-1.5",
            sizeClass
          )}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}

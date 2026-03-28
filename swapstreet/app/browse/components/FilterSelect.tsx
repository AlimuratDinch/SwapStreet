import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarMenuItem } from "@/components/ui/sidebar";
import { plurals } from "./constants";

// --- Re-type shadcn Select sub-components to accept children ---
const SafeSelectTrigger = SelectTrigger as React.ComponentType<
  React.ComponentPropsWithoutRef<typeof SelectTrigger> & {
    children?: React.ReactNode;
    className?: string;
  }
>;

const SafeSelectContent = SelectContent as React.ComponentType<
  React.ComponentPropsWithoutRef<typeof SelectContent> & {
    children?: React.ReactNode;
    className?: string;
  }
>;

const SafeSelectItem = SelectItem as React.ComponentType<
  React.ComponentPropsWithoutRef<typeof SelectItem> & {
    children?: React.ReactNode;
    key?: string;
    value: string;
  }
>;

interface FilterSelectProps {
  label: string;
  icon: React.ReactNode;
  value: string;
  onValueChange: (val: string) => void;
  options: string[];
}

export function FilterSelect({
  label,
  icon,
  value,
  onValueChange,
  options,
}: FilterSelectProps) {
  return (
    <SidebarMenuItem className="group-data-[collapsible=icon]:hidden">
      <div className="px-2 space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          {icon}
          <span>{label}</span>
        </label>
        <Select value={value} onValueChange={onValueChange}>
          <SafeSelectTrigger className="h-9 w-full bg-background border-input focus:ring-1 focus:ring-teal-500">
            <SelectValue placeholder={`Select ${label}`} />
          </SafeSelectTrigger>
          <SafeSelectContent className="max-h-[250px] overflow-y-auto">
            <SafeSelectItem value="all">
              All {plurals[label] ?? label}
            </SafeSelectItem>
            {options.map((opt) => (
              <SafeSelectItem key={opt} value={opt}>
                {/* Visual cleanup: "HandM" -> "H and M", "UsedExcellent" -> "Used Excellent" */}
                {opt.replace(/([A-Z])/g, " $1").trim()}
              </SafeSelectItem>
            ))}
          </SafeSelectContent>
        </Select>
      </div>
    </SidebarMenuItem>
  );
}

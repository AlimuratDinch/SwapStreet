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

const displayLabelMap: Record<string, string> = {
  HandM: "H&M",
  XXS: "XXS",
  XS: "XS",
  XL: "XL",
  XXL: "XXL",
};

const colorMap: Record<string, string> = {
  Black: "#000000",
  White: "#FFFFFF",
  Red: "#EF4444",
  Blue: "#3B82F6",
  Green: "#22C55E",
  Yellow: "#EAB308",
  Pink: "#EC4899",
  Purple: "#A855F7",
  Orange: "#F97316",
  Brown: "#92400E",
  Grey: "#6B7280",
  Beige: "#D4A574",
  Silver: "#C0C0C0",
  Gold: "#FFD700",
  Clear: "#F5F5F5",
  MultiColor: "linear-gradient(135deg, #FF0000, #00FF00, #0000FF)",
};

function formatOptionLabel(option: string): string {
  if (displayLabelMap[option]) {
    return displayLabelMap[option];
  }
  return option.replace(/([A-Z])/g, " $1").trim();
}

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
                <div className="flex items-center gap-2">
                  {label === "Colour" && (
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{
                        backgroundImage:
                          opt === "MultiColor"
                            ? "linear-gradient(90deg, #ef4444 0 33.33%, #22c55e 33.33% 66.66%, #3b82f6 66.66% 100%)"
                            : undefined,
                        backgroundColor:
                          opt === "MultiColor"
                            ? undefined
                            : colorMap[opt] || "#CCCCCC",
                        border:
                          opt === "White" ? "1px solid #D1D5DB" : undefined,
                      }}
                    />
                  )}
                  <span>{formatOptionLabel(opt)}</span>
                </div>
              </SafeSelectItem>
            ))}
          </SafeSelectContent>
        </Select>
      </div>
    </SidebarMenuItem>
  );
}

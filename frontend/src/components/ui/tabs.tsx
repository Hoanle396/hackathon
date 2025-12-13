import * as React from "react";
import { cn } from "@/lib/utils";

const Tabs = ({
  defaultValue,
  children,
  className,
}: {
  defaultValue: string;
  children: React.ReactNode;
  className?: string;
}) => {
  const [activeTab, setActiveTab] = React.useState(defaultValue);

  return (
    <div className={className}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { activeTab, setActiveTab } as any);
        }
        return child;
      })}
    </div>
  );
};

const TabsList = ({
  children,
  activeTab,
  setActiveTab,
  className,
}: {
  children: React.ReactNode;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  className?: string;
}) => (
  <div
    className={cn(
      "inline-flex h-11 items-center justify-center rounded-lg bg-zinc-800/50 p-1 border border-zinc-700",
      className
    )}
  >
    {React.Children.map(children, (child) => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child, { activeTab, setActiveTab } as any);
      }
      return child;
    })}
  </div>
);

const TabsTrigger = ({
  value,
  children,
  activeTab,
  setActiveTab,
  className,
}: {
  value: string;
  children: React.ReactNode;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  className?: string;
}) => (
  <button
    onClick={() => setActiveTab?.(value)}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900",
      "disabled:pointer-events-none disabled:opacity-50",
      activeTab === value
        ? "bg-zinc-700 text-white shadow-sm"
        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50",
      className
    )}
  >
    {children}
  </button>
);

const TabsContent = ({
  value,
  children,
  activeTab,
  className,
}: {
  value: string;
  children: React.ReactNode;
  activeTab?: string;
  className?: string;
}) => {
  if (activeTab !== value) return null;

  return (
    <div
      className={cn(
        "mt-4 ring-offset-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2",
        className
      )}
    >
      {children}
    </div>
  );
};

export { Tabs, TabsList, TabsTrigger, TabsContent };

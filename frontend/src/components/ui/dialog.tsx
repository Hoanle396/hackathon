import * as React from "react"
import * as ReactDOM from "react-dom"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  if (!open || !mounted) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999]">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative h-full flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full py-8 animate-in fade-in-0 zoom-in-95 duration-300 drop-shadow-2xl">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  onClose?: () => void;
}

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, onClose, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative bg-zinc-900 border-2 border-zinc-600 rounded-2xl mx-auto",
        "backdrop-blur-xl bg-zinc-900",
        "shadow-[0_0_60px_rgba(255,255,255,0.1)] ring-1 ring-white/10",
        className
      )}
      {...props}
    >
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 rounded-lg p-2 opacity-70 ring-offset-zinc-900 transition-all hover:opacity-100 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:pointer-events-none"
        >
          <X className="h-5 w-5 text-zinc-400 hover:text-white" />
          <span className="sr-only">Close</span>
        </button>
      )}
      {children}
    </div>
  )
);
DialogContent.displayName = "DialogContent";

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-left mb-6 pr-8",
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl sm:text-3xl font-bold text-white leading-tight tracking-tight",
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm sm:text-base text-zinc-400 leading-relaxed", className)}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6",
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

interface DialogTriggerProps {
  children: React.ReactNode;
  onClick: () => void;
}

const DialogTrigger = ({ children, onClick }: DialogTriggerProps) => {
  return React.cloneElement(children as React.ReactElement, { onClick });
};

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
};

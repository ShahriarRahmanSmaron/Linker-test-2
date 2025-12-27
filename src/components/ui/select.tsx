import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-pointer items-center justify-center py-2 bg-gradient-to-b from-accent-50 to-transparent",
      "hover:bg-accent-100 transition-colors",
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4 text-accent-600" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-pointer items-center justify-center py-2 bg-white border-t border-neutral-100 z-10",
      "hover:bg-neutral-50 transition-colors shadow-[0_-4px_12px_rgba(0,0,0,0.05)]",
      className
    )}
    {...props}
  >
    <div className="flex flex-col items-center gap-0.5 text-primary-600">
      <span className="text-[10px] font-bold uppercase tracking-wider">More</span>
      <ChevronDown className="h-3.5 w-3.5" />
    </div>
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-[100] max-h-[min(60vh,450px)] min-w-[8rem] overflow-hidden rounded-xl",
        "flex flex-col", // Added flex-col for proper scrolling
        "border border-accent-200 bg-gradient-to-b from-white to-accent-50/50",
        "text-neutral-900 shadow-[0_20px_50px_rgba(0,0,0,0.15)]",
        // Enhanced animations
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[side=bottom]:slide-in-from-top-4 data-[side=top]:slide-in-from-bottom-4",
        "duration-300 ease-out",
        position === "popper" &&
        "data-[side=bottom]:translate-y-2 data-[side=left]:-translate-x-2 data-[side=right]:translate-x-2 data-[side=top]:-translate-y-2",
        className
      )}
      position={position}
      sideOffset={4}
      collisionPadding={{ top: 50, bottom: 40, left: 20, right: 20 }}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-2 overflow-y-auto flex-1", // Added flex-1
          position === "popper" &&
          "w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectGridContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> & { columns?: number }
>(({ className, children, position = "popper", columns = 4, ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-[100] max-h-[min(var(--radix-select-content-available-height),600px)] overflow-hidden rounded-2xl",
        "flex flex-col", // Added flex-col for proper scrolling
        "border border-blue-100 bg-blue-50", // Stronger blue background
        "text-neutral-900 shadow-[0_30px_70px_rgba(0,0,0,0.2)]",
        "min-w-[8rem] w-[var(--radix-select-trigger-width)] md:w-[min(95vw,900px)]",
        // Enhanced animations
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[side=bottom]:slide-in-from-top-6 data-[side=top]:slide-in-from-bottom-6",
        "duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
        position === "popper" && "translate-y-3",
        className
      )}
      position={position}
      sideOffset={8}
      collisionPadding={{ top: 20, bottom: 20, left: 20, right: 20 }}
      align="start"
      {...props}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-4 overflow-y-auto flex-1 w-full custom-scrollbar", // Added custom-scrollbar class
          "grid gap-3",
          columns === 2 && "grid-cols-2",
          columns === 3 && "grid-cols-3",
          columns === 4 && "grid-cols-4",
          columns === 5 && "grid-cols-5"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectGridContent.displayName = "SelectGridContent"

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-pointer select-none items-center rounded-lg py-3 pl-10 pr-4 text-xs outline-none", // Changed to text-xs
      "min-h-[48px] md:min-h-[40px] h-full",
      "whitespace-normal leading-tight",
      "border border-blue-100/50",
      "transition-all duration-200 ease-out",
      "text-neutral-800 font-medium",
      // Hover and focus states - Blue theme
      "focus:bg-blue-100/80 focus:text-blue-900 focus:border-blue-200",
      "hover:bg-blue-100/50 active:bg-blue-100 hover:border-blue-200",
      // Selected state styling
      "data-[state=checked]:bg-blue-100 data-[state=checked]:text-blue-900 data-[state=checked]:font-bold data-[state=checked]:shadow-sm data-[state=checked]:border-blue-300",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2.5 flex h-4 w-4 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4 text-primary-600" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectGridContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}


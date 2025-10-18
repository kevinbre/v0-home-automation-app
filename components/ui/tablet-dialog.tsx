"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const TabletDialog = DialogPrimitive.Root
const TabletDialogTrigger = DialogPrimitive.Trigger
const TabletDialogPortal = DialogPrimitive.Portal
const TabletDialogClose = DialogPrimitive.Close

const TabletDialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
TabletDialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const TabletDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    size?: "sm" | "md" | "lg" | "xl" | "full"
  }
>(({ className, children, size = "lg", ...props }, ref) => {
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
    full: "max-w-[95vw]"
  }

  return (
    <TabletDialogPortal>
      <TabletDialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-3xl glass-strong border-white/10",
          // Optimizado para tablet horizontal
          sizeClasses[size],
          // Altura máxima que se adapta al teclado virtual
          "max-h-[85vh] overflow-y-auto",
          // Padding extra para que no se corten los elementos al hacer scroll
          "pb-8",
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-xl opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground glass p-2">
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </TabletDialogPortal>
  )
})
TabletDialogContent.displayName = DialogPrimitive.Content.displayName

const TabletDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left mb-4",
      className
    )}
    {...props}
  />
)
TabletDialogHeader.displayName = "TabletDialogHeader"

const TabletDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6 sticky bottom-0 bg-background/95 backdrop-blur pt-4 -mb-8 -mx-6 px-6 pb-6 rounded-b-3xl border-t border-white/10",
      className
    )}
    {...props}
  />
)
TabletDialogFooter.displayName = "TabletDialogFooter"

const TabletDialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
TabletDialogTitle.displayName = DialogPrimitive.Title.displayName

const TabletDialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
TabletDialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  TabletDialog,
  TabletDialogPortal,
  TabletDialogOverlay,
  TabletDialogClose,
  TabletDialogTrigger,
  TabletDialogContent,
  TabletDialogHeader,
  TabletDialogFooter,
  TabletDialogTitle,
  TabletDialogDescription,
}
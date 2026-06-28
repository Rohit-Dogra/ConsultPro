import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import React from "react"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <ToastProvider duration={5000}>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        // If this toast matches the special message, render a centered popup instead
        const isRolePopup = typeof title === 'string' && title.includes("You're in the Right Place")
          && typeof description === 'string' && description.includes('Case studies are available for solution seekers')
          && props.open !== false

        if (isRolePopup) {
          return (
            <div key={id} className="fixed inset-0 z-[9999] flex items-center justify-center">
              <div className="absolute inset-0 bg-black/40" onClick={() => {
                // dismiss when clicking backdrop
                dismiss(id)
              }} />

              <div className="relative z-10 w-80 rounded-md border bg-popover p-4 text-popover-foreground shadow-md">
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground mt-2">{description}</p>
                <div className="flex justify-center pt-3">
                  <Button size="sm" onClick={() => dismiss(id)}>Got it</Button>
                </div>
              </div>
            </div>
          )
        }

        return (
          <Toast
            key={id}
            {...props}
            className={`${props.variant === 'destructive' 
              ? 'bg-red-50 border-2 border-red-500 text-red-600'
              : 'bg-white border-2 border-green-500 text-green-600'
            } shadow-lg`}
          >
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription className={props.variant === 'destructive' 
                  ? 'text-red-600' 
                  : 'text-green-600'
                }>
                  {description}
                </ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport 
        className="fixed top-4 right-4 flex flex-col gap-2 w-[380px] max-w-[90vw] z-[9999]" 
      />
    </ToastProvider>
  )
}

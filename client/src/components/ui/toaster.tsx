import { useToast } from "../../hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "../../components/ui/toast"

const SuccessIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 22 22"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="flex-shrink-0 mt-0.5"
  >
    <circle cx="11" cy="11" r="10" stroke="#4CAF50" strokeWidth="1.5" />
    <path
      d="M7 11L9.5 13.5L15 8"
      stroke="#4CAF50"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        const isSuccess = !props.variant || props.variant === 'default';
        return (
          <Toast key={id} {...props}>
            {isSuccess && <SuccessIcon />}
            <div className="grid gap-0.5 flex-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}

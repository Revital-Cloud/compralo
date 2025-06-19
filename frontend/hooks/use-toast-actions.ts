import { toast } from "sonner"

export function useToastActions() {
  const showSuccess = (message: string, description?: string) => {
    toast.success(message, {
      description,
    })
  }

  const showError = (message: string, description?: string) => {
    toast.error(message, {
      description,
    })
  }

  const showInfo = (message: string, description?: string) => {
    toast.info(message, {
      description,
    })
  }

  const showWarning = (message: string, description?: string) => {
    toast.warning(message, {
      description,
    })
  }

  const showLoading = (message: string) => {
    return toast.loading(message)
  }

  const dismiss = (toastId?: string | number) => {
    toast.dismiss(toastId)
  }

  return {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showLoading,
    dismiss,
  }
} 
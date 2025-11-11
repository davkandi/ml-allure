// Working compatibility shim for HMR cached modules
// Re-exports sonner's toast as a functional replacement
import { toast as sonnerToast } from "sonner";

// Re-export sonner's toast directly
export const toast = sonnerToast;

// Provide useToast hook that returns sonner's toast
export function useToast() {
  return {
    toast: sonnerToast,
    dismiss: sonnerToast.dismiss,
  };
}

// Default export
export default useToast;
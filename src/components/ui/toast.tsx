// Compatibility shim for HMR cached modules - DO NOT USE IN NEW CODE
// This file exists only to prevent build errors from cached references

import * as React from "react";

export const Toast = () => null;
export const ToastAction = () => null;
export const ToastClose = () => null;
export const ToastDescription = () => null;
export const ToastProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const ToastTitle = () => null;
export const ToastViewport = () => null;

// Re-export types that might be expected
export type ToastProps = any;
export type ToastActionElement = any;
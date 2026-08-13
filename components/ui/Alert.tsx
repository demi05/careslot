interface AlertProps {
  variant: "success" | "error";
  children: React.ReactNode;
}

export function Alert({ variant, children }: AlertProps) {
  const isSuccess = variant === "success";
  return (
    <div
      role={isSuccess ? "status" : "alert"}
      className={`rounded-lg border px-4 py-3 text-sm font-medium ${
        isSuccess
          ? "border-success/30 bg-success-tint text-success"
          : "border-danger/30 bg-danger-tint text-danger"
      }`}
    >
      {children}
    </div>
  );
}

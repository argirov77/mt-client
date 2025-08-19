import React from "react";

export default function FormInput({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`border rounded p-2 hover:bg-slate-100 ${className}`}
      {...props}
    />
  );
}


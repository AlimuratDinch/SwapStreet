interface AuthButtonProps {
  children: React.ReactNode;
  disabled?: boolean;
  type?: "submit" | "button";
}

export default function AuthButton({
  children,
  disabled = false,
  type = "submit",
}: AuthButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className="w-full mt-6 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white font-medium 
                 py-3 px-4 rounded-lg transition-colors shadow-sm"
    >
      {children}
    </button>
  );
}

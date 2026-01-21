interface ErrorMessageProps {
  message: string;
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) return null;

  return (
    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded">
      <p className="text-sm">{message}</p>
    </div>
  );
}

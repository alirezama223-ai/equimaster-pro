type Props = {
  message: string;
  className?: string;
};

export default function ErrorState({ message, className = "" }: Props) {
  return (
    <div className={`rounded-2xl border border-red-500/30 bg-red-500/5 px-4 py-4 ${className}`}>
      <p className="text-sm text-red-200">{message}</p>
    </div>
  );
}

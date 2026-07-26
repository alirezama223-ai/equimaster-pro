type Props = {
  label: string;
  htmlFor?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
};

export const sellInputClassName =
  "w-full rounded-xl bg-[#08111F] border border-gray-700 px-5 py-4 text-white placeholder-gray-500 outline-none focus:border-blue-500 transition";

export const sellLabelClassName =
  "mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-400";

export default function FormField({
  label,
  htmlFor,
  error,
  required = false,
  children,
  className = "",
}: Props) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className={sellLabelClassName}>
        {label}
        {required ? <span className="text-blue-400"> *</span> : null}
      </label>
      {children}
      {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
    </div>
  );
}

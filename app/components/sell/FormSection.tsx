type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export default function FormSection({ title, subtitle, children }: Props) {
  return (
    <section className="rounded-3xl bg-[#111C2E] border border-gray-800 p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        {subtitle ? (
          <p className="mt-2 text-gray-400 text-sm sm:text-base">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

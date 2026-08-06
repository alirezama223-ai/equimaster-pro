type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export default function AdminPageHeader({ eyebrow, title, description, action }: Props) {
  return (
    <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-sm uppercase tracking-[0.2em] text-blue-400">{eyebrow}</p>
        ) : null}
        <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">{title}</h2>
        {description ? <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-400">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

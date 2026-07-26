import Link from "next/link";

type Props = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footerText: string;
  footerHref: string;
  footerLinkLabel: string;
};

export default function AuthFormShell({
  title,
  subtitle,
  children,
  footerText,
  footerHref,
  footerLinkLabel,
}: Props) {
  return (
    <section className="rounded-3xl bg-[#111C2E] border border-gray-800 shadow-2xl p-6 sm:p-10">
      <div className="text-center mb-8">
        <p className="uppercase tracking-[6px] text-blue-500 text-xs font-semibold">
          EquiMaster Pro
        </p>
        <h1 className="text-3xl sm:text-4xl font-black text-white mt-4">{title}</h1>
        <p className="mt-3 text-gray-400">{subtitle}</p>
      </div>

      {children}

      <p className="mt-8 text-center text-gray-400">
        {footerText}{" "}
        <Link href={footerHref} className="text-blue-400 hover:text-blue-300 font-semibold">
          {footerLinkLabel}
        </Link>
      </p>
    </section>
  );
}

export const authInputClassName =
  "w-full rounded-xl bg-[#08111F] border border-gray-700 px-5 py-4 text-white placeholder-gray-500 outline-none focus:border-blue-500 transition";

export const authLabelClassName =
  "mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-400";

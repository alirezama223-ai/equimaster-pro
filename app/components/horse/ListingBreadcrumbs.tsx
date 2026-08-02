import { Link } from "@/i18n/navigation";
import { MARKETPLACE_PATHS } from "@/app/lib/marketplace/paths";

type Props = {
  horseName: string;
  breed: string;
  breedHref: string;
  ariaLabel: string;
  homeLabel: string;
  marketplaceLabel: string;
};

function BreadcrumbSeparator() {
  return (
    <li aria-hidden="true" className="text-gray-600">
      /
    </li>
  );
}

export default function ListingBreadcrumbs({
  horseName,
  breed,
  breedHref,
  ariaLabel,
  homeLabel,
  marketplaceLabel,
}: Props) {
  return (
    <nav aria-label={ariaLabel}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-400">
        <li>
          <Link href="/" className="hover:text-white transition">
            {homeLabel}
          </Link>
        </li>
        <BreadcrumbSeparator />
        <li>
          <Link href={MARKETPLACE_PATHS.home} className="hover:text-white transition">
            {marketplaceLabel}
          </Link>
        </li>
        <BreadcrumbSeparator />
        <li>
          <Link href={breedHref} className="hover:text-white transition">
            {breed}
          </Link>
        </li>
        <BreadcrumbSeparator />
        <li className="text-gray-200" aria-current="page">
          {horseName}
        </li>
      </ol>
    </nav>
  );
}

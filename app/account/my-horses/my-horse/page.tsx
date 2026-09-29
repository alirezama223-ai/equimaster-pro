import { redirect } from "next/navigation";

export default function MyHorseLegacyRoute() {
  // Keep the public/default-locale URL working even when next-intl does not
  // rewrite an unprefixed request before Next.js resolves the app route.
  redirect("/en/account/my-horses/my-horse");
}

import { redirect } from "next/navigation";
import Navbar from "@/app/components/navbar/Navbar";
import InboxClient from "@/app/components/messaging/InboxClient";
import { getConversations } from "@/app/actions/messaging";
import { loginRedirectPath } from "@/app/lib/auth/paths";
import { createPageMetadata } from "@/app/lib/seo/page-metadata";
import { createClient } from "@/app/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return createPageMetadata("inbox", "/inbox");
}

export default async function InboxPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(loginRedirectPath("/inbox"));
  }

  const conversationsResult = await getConversations(1);

  return (
    <>
      <Navbar />
      <main className="min-h-screen overflow-x-hidden bg-[#081223] pt-28 pb-[calc(5rem+env(safe-area-inset-bottom))] text-white lg:pb-24">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-5 lg:px-6">
          <InboxClient
            currentUserId={user.id}
            initialConversations={conversationsResult.conversations}
            initialHasMore={conversationsResult.hasMore}
            selectedConversationId={null}
            initialThread={null}
            initialThreadHasMore={false}
          />
        </div>
      </main>
    </>
  );
}

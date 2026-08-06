import { redirect } from "next/navigation";
import Navbar from "@/app/components/navbar/Navbar";
import InboxClient from "@/app/components/messaging/InboxClient";
import { getConversationThread, getConversations } from "@/app/actions/messaging";
import { loginRedirectPath } from "@/app/lib/auth/paths";
import { createPageMetadata } from "@/app/lib/seo/page-metadata";
import { createClient } from "@/app/lib/supabase/server";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ conversationId: string }>;
};

export async function generateMetadata() {
  return createPageMetadata("inbox", "/inbox");
}

export default async function InboxConversationPage({ params }: Props) {
  const { conversationId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(loginRedirectPath(`/inbox/${conversationId}`));
  }

  const [conversationsResult, threadResult] = await Promise.all([
    getConversations(1),
    getConversationThread(conversationId),
  ]);

  if (threadResult.error && !threadResult.thread) {
    redirect("/inbox");
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen overflow-x-hidden bg-[#081223] pt-28 pb-[calc(5rem+env(safe-area-inset-bottom))] text-white lg:pb-24">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-5 lg:px-6">
          <InboxClient
            currentUserId={user.id}
            initialConversations={conversationsResult.conversations}
            initialHasMore={conversationsResult.hasMore}
            selectedConversationId={conversationId}
            initialThread={threadResult.thread}
            initialThreadHasMore={threadResult.hasMore}
          />
        </div>
      </main>
    </>
  );
}

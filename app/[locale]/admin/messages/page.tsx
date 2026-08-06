import { getTranslations } from "next-intl/server";
import AdminPageHeader from "@/app/components/admin/AdminPageHeader";
import AdminMessagesClient from "@/app/components/admin/AdminMessagesClient";
import { getAdminConversations, getAdminMessages } from "@/app/actions/admin-enterprise";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export default async function AdminMessagesPage({ searchParams }: Props) {
  const t = await getTranslations("admin");
  const params = await searchParams;
  const page = Math.max(Number(params.page) || 1, 1);
  const [{ messages, hasMore, error }, { conversations, error: conversationsError }] = await Promise.all([
    getAdminMessages(page),
    getAdminConversations(),
  ]);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow={t("adminEyebrow")}
        title={t("messages.title")}
        description={t("messages.subtitle")}
      />
      <AdminMessagesClient
        messages={messages}
        conversations={conversations}
        page={page}
        hasMore={hasMore}
        error={error ?? conversationsError}
      />
    </div>
  );
}

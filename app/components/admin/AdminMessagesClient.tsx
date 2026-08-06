"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import AdminPagination from "@/app/components/admin/AdminPagination";
import { ADMIN_TABLE_CLASS } from "@/app/components/admin/admin-styles";
import type { AdminConversationListItem, AdminMessageListItem } from "@/app/types/admin-panel";

type Props = {
  messages: AdminMessageListItem[];
  conversations: AdminConversationListItem[];
  page: number;
  hasMore: boolean;
  error?: string;
};

export default function AdminMessagesClient({ messages, conversations, page, hasMore, error }: Props) {
  const t = useTranslations("admin.messages");
  const locale = useLocale();
  const router = useRouter();

  function formatDate(value: string) {
    return new Date(value).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });
  }

  return (
    <div className="space-y-8">
      {error ? (
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-red-200">{error}</div>
      ) : null}

      <section className="space-y-4">
        <h3 className="text-lg font-bold text-white">{t("conversationsTitle")}</h3>
        {conversations.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 px-6 py-10 text-center text-gray-500">
            {t("emptyConversations")}
          </div>
        ) : (
          <div className={ADMIN_TABLE_CLASS}>
            <table className="min-w-full divide-y divide-white/10 text-sm">
              <thead className="bg-[#0B1424] text-left text-xs uppercase tracking-wide text-gray-400">
                <tr>
                  <th className="px-4 py-4">{t("columns.listing")}</th>
                  <th className="px-4 py-4">{t("columns.buyer")}</th>
                  <th className="px-4 py-4">{t("columns.seller")}</th>
                  <th className="px-4 py-4">{t("columns.messages")}</th>
                  <th className="px-4 py-4">{t("columns.updated")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 bg-[#111827]">
                {conversations.map((conversation) => (
                  <tr key={conversation.id}>
                    <td className="px-4 py-4 text-white">{conversation.listingName}</td>
                    <td className="px-4 py-4 font-mono text-xs text-gray-300">{conversation.buyerReference}</td>
                    <td className="px-4 py-4 font-mono text-xs text-gray-300">{conversation.sellerReference}</td>
                    <td className="px-4 py-4 text-gray-300">{conversation.messageCount}</td>
                    <td className="px-4 py-4 text-gray-400">{formatDate(conversation.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-bold text-white">{t("recentMessagesTitle")}</h3>
        {messages.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 px-6 py-10 text-center text-gray-500">
            {t("emptyMessages")}
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <article key={message.id} className="rounded-3xl border border-white/10 bg-[#111827] p-5">
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <span>{message.listingName}</span>
                  <span>·</span>
                  <span className="font-mono">{message.senderReference}</span>
                  <span>·</span>
                  <span>{formatDate(message.createdAt)}</span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm text-white">{message.body}</p>
              </article>
            ))}
          </div>
        )}

        <AdminPagination
          page={page}
          hasMore={hasMore}
          previousLabel={t("pagination.previous")}
          nextLabel={t("pagination.next")}
          pageLabel={t("pagination.page", { page })}
          onPrevious={() => router.push(page > 2 ? `/admin/messages?page=${page - 1}` : "/admin/messages")}
          onNext={() => router.push(`/admin/messages?page=${page + 1}`)}
        />
      </section>
    </div>
  );
}

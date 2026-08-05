"use client";

import { memo } from "react";
import FadeUp from "@/app/components/animations/FadeUp";
import SellerCrmAiAssistant from "@/app/components/seller-dashboard/crm/SellerCrmAiAssistant";
import SellerCrmBuyers from "@/app/components/seller-dashboard/crm/SellerCrmBuyers";
import SellerCrmCalendar from "@/app/components/seller-dashboard/crm/SellerCrmCalendar";
import SellerCrmNotifications from "@/app/components/seller-dashboard/crm/SellerCrmNotifications";
import SellerCrmPerformance from "@/app/components/seller-dashboard/crm/SellerCrmPerformance";
import SellerCrmPipeline from "@/app/components/seller-dashboard/crm/SellerCrmPipeline";
import type { SellerCrmData } from "@/app/components/seller-dashboard/crm/seller-crm-types";

type Props = {
  crm: SellerCrmData;
};

function SellerCrmHub({ crm }: Props) {
  return (
    <div className="space-y-8 lg:space-y-10">
      <FadeUp>
        <SellerCrmAiAssistant recommendations={crm.aiRecommendations} />
      </FadeUp>

      <FadeUp>
        <SellerCrmPipeline initialDeals={crm.pipeline} />
      </FadeUp>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-10">
        <div className="min-w-0 space-y-8">
          <FadeUp>
            <SellerCrmBuyers buyers={crm.buyers} />
          </FadeUp>
          <FadeUp>
            <SellerCrmCalendar visits={crm.visits} />
          </FadeUp>
          <FadeUp>
            <SellerCrmPerformance performance={crm.performance} />
          </FadeUp>
        </div>

        <aside className="min-w-0 space-y-8">
          <FadeUp>
            <SellerCrmNotifications notifications={crm.notifications} />
          </FadeUp>
        </aside>
      </div>
    </div>
  );
}

export default memo(SellerCrmHub);

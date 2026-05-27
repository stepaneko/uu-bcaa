import React from "react";
import VatOverviewContent from "./vat-overview-content";
import { VatOverviewProvider } from "./vat-overview-provider";

function VatOverview() {
  return (
      <VatOverviewProvider>
        <VatOverviewContent />
      </VatOverviewProvider>
  );
}

export default VatOverview;
import Container from "react-bootstrap/esm/Container";
// import TaxpayerListProvider from "./taxpayer-list-provider";
// import TaxperiodListProvider from "./taxperiod-list-provider";
// import InvoiceListProvider from "./invoice-list-provider";
import VatOverviewContent from "./vat-overview-content";

// function VatOverview() {
//   return (
//     <Container>
//       <TaxpayerListProvider>
//         <TaxperiodListProvider>
//           <InvoiceListProvider>
//             <VatOverviewContent />
//           </InvoiceListProvider>
//         </TaxperiodListProvider>
//       </TaxpayerListProvider>
//     </Container>
//   );
// }

function VatOverview() {
  return (
    <Container>
      {/* <TaxpayerListProvider>
        <TaxperiodListProvider>
          <InvoiceListProvider> */}
            <VatOverviewContent />
          {/* </InvoiceListProvider>
        </TaxperiodListProvider>
      </TaxpayerListProvider> */}
    </Container>
  );
}

export default VatOverview;
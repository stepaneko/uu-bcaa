import React from 'react';
import { useVatOverview } from './vat-overview-provider';

import { TaxPayersSection } from '../tax-payer/tax-payers-section';
import { TaxPeriodsSection } from '../tax-period/tax-periods-section';
import { InvoicesSection } from '../invoice/invoices-section';
import { TaxPayerModal } from '../tax-payer/tax-payer-modal';
import { InvoiceModal } from '../invoice/invoice-modal';
import { DeleteConfirmModal } from '../common/delete-confirm-modal';

export default function VatOverviewContent() {
    
    const {
        API_BASE_URL,
        selectedTaxPayer, selectedPeriod, setSelectedPeriod,
        showTaxPayerModal, setShowTaxPayerModal, taxPayerModalData,
        showInvoiceModal, setShowInvoiceModal, invoiceModalData,
        refreshTaxPayersTrigger, refreshInvoicesTrigger, refreshPeriodsTrigger,
        alertData, setAlertData,
        deleteTaxPayerData, setDeleteTaxPayerData,
        deleteInvoiceData, setDeleteInvoiceData,
        handleTaxPayerSelect, handleShowAlert,
        handleOpenCreateTaxPayerModal, handleOpenEditTaxPayerModal, handleTaxPayerModalSave,
        handleOpenCreateInvoiceModal, handleOpenEditInvoiceModal, handleInvoiceModalSave,
        handleExecuteDeleteTaxPayer, handleExecuteDeleteInvoice, handleExportClick
    } = useVatOverview();

    return (
        <div className="position-relative">
            {alertData.show && (
                <div 
                    className={`alert alert-${alertData.type} alert-dismissible fade show shadow`} 
                    role="alert"
                    style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1060, minWidth: '300px' }}
                >
                    {alertData.message}
                    <button type="button" className="btn-close" onClick={() => setAlertData({ show: false, type: '', message: '' })}></button>
                </div>
            )}

            <TaxPayersSection 
                selectedTaxPayer={selectedTaxPayer} 
                onSelect={handleTaxPayerSelect}
                onCreateClick={handleOpenCreateTaxPayerModal}
                onEditClick={handleOpenEditTaxPayerModal}
                onDeleteClick={(tp) => setDeleteTaxPayerData(tp)}
                refreshTrigger={refreshTaxPayersTrigger}
            />

            {selectedTaxPayer && (
                <TaxPeriodsSection 
                    taxPayerId={selectedTaxPayer.id} 
                    selectedPeriod={selectedPeriod}
                    onSelect={setSelectedPeriod}
                    refreshTrigger={refreshPeriodsTrigger}
                    onExportClick={handleExportClick}
                />
            )}

            {selectedTaxPayer && (
                <InvoicesSection 
                    taxPayerId={selectedTaxPayer.id} 
                    period={selectedPeriod} 
                    refreshTrigger={refreshInvoicesTrigger}
                    onCreateClick={handleOpenCreateInvoiceModal}
                    onEditClick={handleOpenEditInvoiceModal}
                    onDeleteClick={(inv) => setDeleteInvoiceData(inv)}
                />
            )}

            <TaxPayerModal 
                show={showTaxPayerModal} 
                taxPayer={taxPayerModalData} 
                onClose={() => setShowTaxPayerModal(false)} 
                onSave={handleTaxPayerModalSave}
                apiBaseUrl={API_BASE_URL}
                onShowAlert={handleShowAlert}
            />
            
            <InvoiceModal 
                show={showInvoiceModal}
                invoice={invoiceModalData}
                taxPayer={selectedTaxPayer}
                period={selectedPeriod}
                onClose={() => setShowInvoiceModal(false)}
                onSave={handleInvoiceModalSave}
                apiBaseUrl={API_BASE_URL}
                onShowAlert={handleShowAlert}
            />

            <DeleteConfirmModal 
                show={!!deleteTaxPayerData}
                title="Delete tax payer"
                message={`Are you sure you want to delete tax payer ${
                    deleteTaxPayerData?.type === 'individual' 
                        ? `${deleteTaxPayerData.title || ''} ${deleteTaxPayerData.firstName || ''} ${deleteTaxPayerData.lastName || ''}`.trim()
                        : deleteTaxPayerData?.companyName || ''
                }?`}
                onClose={() => setDeleteTaxPayerData(null)}
                onConfirm={handleExecuteDeleteTaxPayer}
            />

            <DeleteConfirmModal 
                show={!!deleteInvoiceData}
                title="Delete invoice"
                message={`Are you sure you want to delete invoice ${deleteInvoiceData?.invoiceNumber || ''}?`}
                onClose={() => setDeleteInvoiceData(null)}
                onConfirm={handleExecuteDeleteInvoice}
            />
        </div>
    );
}
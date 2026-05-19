import React from 'react';

interface PaymentTerm {
  range: string;
  description: string;
}

interface FeeTier {
  range: string;
  fee: string;
}

interface ContactPerson {
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  phone: string;
}

interface BankAccount {
  currency: string;
  accountHolder: string;
  accountNumber: string;
  swiftCode: string;
}

interface AgreementData {
  docRef?: string;
  envelopeId?: string;
  agreementDate: string;
  place: string;
  buyer: { name: string; address: string };
  seller: { name: string; address: string };
  sellerCorporateId: string;
  sellerTaxId: string;
  sellerContactPerson: string;
  sellerEmail: string;
  sellerPhone: string;
  paymentTerms: PaymentTerm[];
  transactionFeeTiers: FeeTier[];
  factoringFee: string;
  advanceRate: string;
  setupFee: string;
  lateFee: string;
  referenceRate: string;
  schedule1: {
    primaryContacts: ContactPerson[];
    bankAccounts: BankAccount[];
  };
}

interface WebFrameworkAgreementProps {
  data: AgreementData;
}

const DEFINITION_ITEMS = [
  ['Account Receivable', 'Any monetary obligation arising under an Invoice issued by the Seller to a Buyer that is eligible for purchase under this Agreement.'],
  ['Addendum', 'Any supplemental document or schedule agreed by the Parties that modifies or expands the terms of this Agreement.'],
  ['Advance Rate', 'The percentage of the Invoice value paid as the Initial Purchase Price upon acceptance of an Account Receivable.'],
  ['Adverse Claim', "Any lien, security interest, charge, encumbrance, or other claim that adversely affects the Seller's title to an Account Receivable."],
  ['Agreement', 'This Framework Agreement together with the RPTC, Schedules, Addenda, and any Transaction Confirmations.'],
  ['Applicable Law', 'All laws, regulations, rules, sanctions, and regulatory guidance applicable to the Parties, the Platform, or the Accounts Receivable.'],
  ['Buyer', 'The obligor identified on the Invoice who owes payment for the underlying goods or services.'],
  ['Collection', 'Any payment, credit, set-off, or other settlement received in respect of an Account Receivable.'],
  ['Deferred Purchase Price', 'The balance of the Purchase Price payable to the Seller after Collection, net of Fees and adjustments.'],
  ['Due Date', 'The date on which payment of an Account Receivable becomes contractually due under the Underlying Relationship.'],
  ['Event of Insolvency', 'Any insolvency, bankruptcy, winding up, or analogous proceeding affecting the Seller or a Buyer.'],
  ['Factoring Fee', 'The fee charged for financing and servicing Accounts Receivable as set out in the Transaction Confirmation.'],
  ['Fees', 'Collectively, the Transaction Fee, Factoring Fee, Processing Fee, Set-Up Fee, Late Fee, and any other charges disclosed on the Platform.'],
  ['Initial Purchase Price', 'The portion of the Purchase Price paid to the Seller on the Purchase Date.'],
  ['Intellectual Property', 'All proprietary rights relating to the Platform, software, branding, and documentation of Melenco.'],
  ['Invoice', 'A valid and undisputed invoice issued by the Seller to a Buyer for goods or services delivered in accordance with the Underlying Relationship.'],
  ['Late Fee', 'A monthly compounding servicing fee applied to amounts outstanding beyond the Due Date.'],
  ['Payment Term', 'The agreed period between the invoice date and the Due Date.'],
  ['Platform', 'The Melenco digital platform through which receivables purchase transactions are initiated, confirmed, and serviced.'],
  ['Political Risk', 'Any sovereign, regulatory, or geopolitical event affecting payment or transfer of funds by a Buyer.'],
  ['Portfolio', 'The aggregate of Accounts Receivable purchased by Melenco from the Seller.'],
  ['Processing Fee', 'A fee charged for operational processing, verification, and platform administration.'],
  ['Purchase Price', 'The sum of the Initial Purchase Price and the Deferred Purchase Price for an Account Receivable.'],
  ['Related Rights', 'All rights, remedies, proceeds, and insurance relating to an Account Receivable.'],
  ['Repurchase Price', 'The amount payable by the Seller to repurchase an Account Receivable upon a State of Default.'],
  ['Schedule', 'Any schedule attached to this Agreement, including Schedule 1 and Schedule 2.'],
  ['Security Interest', 'Any pledge, charge, assignment by way of security, or other security interest.'],
  ['Seller Account', 'The verified bank account maintained by the Seller and recorded on the Platform.'],
  ['Set-Up Fee', 'A one-time onboarding fee deducted from the first disbursement.'],
  ['State of Default', 'Any event defined in this Agreement that gives Melenco the right to suspend purchases or demand repurchase.'],
  ['Transaction Fee', 'The fee applied on each purchased Account Receivable.'],
  ['Transfer', 'The assignment, sale, or transfer of an Account Receivable to Melenco.'],
  ['Underlying Relationship', 'The contract, purchase order, or commercial relationship between Seller and Buyer giving rise to the Invoice.'],
] as const;

function pageShell(children: React.ReactNode, page: number, total: number, docRef: string, envelopeId: string) {
  return (
    <section className="relative mx-auto min-h-[1122px] w-full max-w-[794px] overflow-hidden rounded-sm border border-slate-300 bg-white px-[52px] pb-[70px] pt-[92px] shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
      <div className="pointer-events-none absolute left-[24%] top-[42%] -rotate-[32deg] select-none text-[54px] font-bold tracking-[0.6em] text-slate-100 opacity-60">
        Melenco
      </div>
      <div className="absolute left-[52px] right-[52px] top-6 flex items-center justify-between border-b border-slate-300 pb-[10px]">
        <div className="text-[12px] font-bold tracking-[0.1em] text-teal-700">Melenco</div>
        <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-900">Framework Agreement</div>
      </div>
      <div className="mb-3 text-[8px] uppercase tracking-[0.15em] text-slate-400">Trade Finance Documentation - Confidential</div>
      <div className="relative z-10 text-[9.7px] leading-[1.58] text-slate-900">{children}</div>
      <div className="absolute bottom-[22px] left-[52px] right-[52px] flex justify-between border-t border-slate-300 pt-2 text-[7.8px] tracking-[0.04em] text-slate-500">
        <span>Melenco Confidential</span>
        <span>{`Page ${page} of ${total}`}</span>
        <span>{`${docRef} | ${envelopeId}`}</span>
      </div>
    </section>
  );
}

function sectionHeading(text: string) {
  return <h3 className="mb-[10px] mt-[18px] border-b border-slate-200 pb-[6px] text-[13px] font-bold tracking-[0.02em] text-slate-900">{text}</h3>;
}

function clause(number: string, text: string) {
  return (
    <div className="mb-[7px] flex items-start gap-3">
      <div className="w-[42px] shrink-0 text-[9.5px] font-bold text-slate-900">{number}</div>
      <div className="flex-1 text-justify">{text}</div>
    </div>
  );
}

function dataCell(value?: string) {
  return value?.trim() ? value : '-';
}

export function WebFrameworkAgreement({ data }: WebFrameworkAgreementProps) {
  const docRef = data.docRef?.trim() || 'WHZ-FA-2026-05';
  const envelopeId = data.envelopeId?.trim() || 'DS-8A3E-4F1C-9B2D-57A0';
  const totalPages = 6;

  return (
    <div className="space-y-8 bg-slate-100 p-4 md:p-8">
      {pageShell(
        <>
          <h1 className="mt-[18px] text-center text-[22px] font-bold tracking-[0.12em] text-slate-900">FRAMEWORK AGREEMENT</h1>
          <div className="mb-[18px] text-center text-[11px] font-bold tracking-[0.1em] text-slate-500">Seller Financing Agreement</div>

          <div className="mb-[22px] mt-4 border-l-[3px] border-teal-700 bg-slate-50 p-[14px]">
            <p className="mb-2 text-justify">
              This Framework Agreement ("Agreement") is entered into between Melenco, a company incorporated under the laws of India and engaged in international trade finance, receivables financing, invoice factoring, export finance, and supply chain financing solutions, and the Seller identified below.
            </p>
          </div>

          {sectionHeading('Seller Identification')}
          <div className="mt-[10px] border border-slate-300">
            <div className="grid grid-cols-[35%_65%] border-b border-slate-200 bg-slate-50">
              <div className="border-r border-slate-300 px-[10px] py-[9px] font-bold text-slate-900">Field</div>
              <div className="px-[10px] py-[9px] font-bold text-slate-900">Details</div>
            </div>
            {[
              ['Legal Entity Name', data.seller.name],
              ['Registered Office', data.seller.address],
              ['GST Number', data.sellerTaxId],
              ['CIN', data.sellerCorporateId],
              ['Contact Person', data.sellerContactPerson],
              ['Email Address', data.sellerEmail],
              ['Telephone Number', data.sellerPhone],
            ].map(([label, value]) => (
              <div key={label} className="grid grid-cols-[35%_65%] border-b border-slate-200 last:border-b-0">
                <div className="border-r border-slate-200 px-[10px] py-[9px]">{label}</div>
                <div className="px-[10px] py-[9px]">{dataCell(value)}</div>
              </div>
            ))}
          </div>

          <div className="mb-3 mt-[18px] h-px bg-slate-200" />
          {sectionHeading('1. Scope of Framework Agreement')}
          {clause('1.1', 'Seller wishes to utilize trade finance solutions offered through the Melenco Platform, including receivables financing, export financing, invoice factoring, seller financing, purchase order financing, and supply chain liquidity solutions.')}
          {clause('1.2', 'This Agreement governs all receivables purchase transactions executed between Melenco and the Seller and establishes the commercial, legal, operational, technological, and compliance framework applicable to all approved financing transactions.')}
          {clause('1.3', 'The Seller acknowledges that access to Melenco financing products remains subject to internal underwriting standards, sanctions screening, anti-money laundering checks, portfolio concentration limits, and ongoing risk monitoring procedures.')}

          <div className="mb-3 mt-[18px] h-px bg-slate-200" />
          {sectionHeading('2. Payment Terms and Fees')}
          <div className="mt-[10px] border border-slate-300">
            <div className="grid grid-cols-4 border-b border-slate-200 bg-slate-50">
              {['Payment Term', 'Transaction Fee', 'Factoring Fee', 'Advance Rate'].map((label, index) => (
                <div key={label} className={`px-[10px] py-[9px] font-bold text-slate-900 ${index < 3 ? 'border-r border-slate-300' : ''}`}>{label}</div>
              ))}
            </div>
            {(data.transactionFeeTiers.length ? data.transactionFeeTiers : [{ range: '', fee: '' }, { range: '', fee: '' }, { range: '', fee: '' }, { range: '', fee: '' }]).map((tier, idx) => (
              <div key={`${tier.range}-${idx}`} className="grid grid-cols-4 border-b border-slate-200 last:border-b-0">
                <div className="border-r border-slate-200 px-[10px] py-[9px]">{dataCell(tier.range)}</div>
                <div className="border-r border-slate-200 px-[10px] py-[9px]">{dataCell(tier.fee)}</div>
                <div className="border-r border-slate-200 px-[10px] py-[9px]">{dataCell(data.factoringFee)}</div>
                <div className="px-[10px] py-[9px]">{dataCell(data.advanceRate)}</div>
              </div>
            ))}
          </div>
          {clause('2.1', 'All Fees disclosed by Melenco shall be deemed commercially confidential and may vary based on Buyer risk profile, jurisdiction, transaction tenor, trade corridor exposure, and portfolio concentration metrics.')}
          {clause('2.2', 'Melenco reserves the right to revise pricing structures, treasury spreads, processing charges, and operational fees in response to market conditions, funding costs, and regulatory changes.')}

          {sectionHeading('Execution')}
          <div className="mt-[18px] min-h-[150px] rounded-[6px] border border-slate-300 bg-slate-50 p-4">
            <div className="mb-[7px] text-[10.4px] font-bold text-slate-900">For and on behalf of Melenco</div>
            <div className="mb-[10px] mt-7 border-b border-slate-500" />
            <div>Authorized Signatory</div>
            <div className="mb-[10px] mt-7 border-b border-slate-500" />
            <div>Date & Place</div>
            <div className="mb-[10px] mt-7 border-b border-slate-500" />
            <div>Seller Signature</div>
          </div>
        </>,
        1,
        totalPages,
        docRef,
        envelopeId,
      )}

      {pageShell(
        <>
          <div className="mb-[10px] text-[15px] font-bold uppercase tracking-[0.1em] text-slate-900">RECEIVABLES PURCHASE TERMS AND CONDITIONS (RPTC)</div>
          <p className="mb-[18px] text-justify text-[9px] leading-[1.5] text-slate-500">
            These Receivables Purchase Terms and Conditions form an integral part of the Framework Agreement and apply to each receivables purchase transaction executed on the Melenco Platform.
          </p>
          <div className="border-x border-t border-slate-200">
            {DEFINITION_ITEMS.map(([term, definition]) => (
              <div key={term} className="grid grid-cols-[28%_72%] border-b border-slate-200">
                <div className="border-r border-slate-200 bg-slate-50 px-3 py-[10px] text-[10px] font-bold text-slate-900">{term}</div>
                <div className="px-3 py-[10px] text-justify text-[9.5px] leading-[1.55] text-slate-900">{definition}</div>
              </div>
            ))}
          </div>
        </>,
        2,
        totalPages,
        docRef,
        envelopeId,
      )}

      {pageShell(
        <>
          <h3 className="mb-[14px] mt-[22px] border-b border-slate-300 pb-[6px] text-[15.5px] font-bold text-slate-900">4. Offer</h3>
          {clause('4.1', 'The Seller may upload Invoices, shipping records, purchase orders, delivery confirmations, trade documentation, customs declarations, inspection certificates, and related supporting materials onto the Platform for the purpose of offering Accounts Receivable for purchase by Melenco.')}
          {clause('4.2', 'Submission of an Invoice through the Platform constitutes a legally binding offer by the Seller to sell, assign, and transfer the relevant Account Receivable together with all Related Rights to Melenco in accordance with this Agreement.')}
          {clause('4.3', 'Melenco may review, verify, evaluate, approve, conditionally approve, suspend, or reject any proposed transaction in its sole discretion taking into account underwriting standards, sanctions screening, compliance checks, portfolio concentration limits, and internal credit assessment criteria.')}

          <h3 className="mb-[14px] mt-[22px] border-b border-slate-300 pb-[6px] text-[15.5px] font-bold text-slate-900">5. Sale and Purchase of Accounts Receivable</h3>
          {clause('5.1', 'Upon acceptance by Melenco, the Seller irrevocably sells, assigns, transfers, conveys, and grants to Melenco all legal and beneficial rights, title, and interest in and to the relevant Accounts Receivable together with all Related Rights.')}
          {clause('5.2', 'The Parties acknowledge and agree that each Transfer is intended to constitute a true sale transaction and not merely the creation of security.')}
          {clause('5.3', 'The Seller shall promptly notify Melenco upon becoming aware of Buyer disputes, offsets, counterclaims, credit notes, delayed shipments, payment delays, defective goods, sanctions concerns, or any event affecting collectability.')}
        </>,
        3,
        totalPages,
        docRef,
        envelopeId,
      )}

      {pageShell(
        <>
          <h3 className="mb-[14px] mt-[22px] border-b border-slate-300 pb-[6px] text-[15.5px] font-bold text-slate-900">6. Payment of Purchase Price</h3>
          {clause('6.1', 'Subject to the terms and conditions of this Agreement, Melenco shall disburse the Initial Purchase Price to the Seller Account on the applicable Purchase Date following approval and acceptance of the relevant Account Receivable.')}
          {clause('6.2', 'The Deferred Purchase Price shall become payable only after Collection of the relevant Account Receivable by Melenco and after deduction of all Fees, adjustments, treasury spreads, legal costs, recovery expenses, taxes, and other applicable amounts.')}
          {clause('6.3', 'All payments under this Agreement shall be made in the currency of the relevant Invoice unless Melenco agrees otherwise or applicable law requires currency conversion.')}
          {clause('6.4', 'If any payment relating to a transferred Account Receivable is mistakenly received by the Seller, the Seller shall hold such funds in trust for Melenco and remit the same within two Business Days.')}
        </>,
        4,
        totalPages,
        docRef,
        envelopeId,
      )}

      {pageShell(
        <>
          <h3 className="mb-[10px] mt-[18px] border-b border-slate-200 pb-[6px] text-[13px] font-bold tracking-[0.02em] text-slate-900">SCHEDULE 1 - Contact and Bank Account Details</h3>
          <div className="mb-[7px] mt-3 text-[10.4px] font-bold text-slate-900">Primary Contact Persons</div>
          <div className="border border-slate-300">
            <div className="grid grid-cols-[20%_20%_35%_25%] border-b border-slate-200 bg-slate-50">
              {['First Name', 'Last Name', 'Email', 'Phone Number'].map((label, index) => (
                <div key={label} className={`px-[10px] py-[9px] font-bold text-slate-900 ${index < 3 ? 'border-r border-slate-300' : ''}`}>{label}</div>
              ))}
            </div>
            {(data.schedule1.primaryContacts.length ? data.schedule1.primaryContacts : [{ firstName: '', lastName: '', company: '', email: '', phone: '' }, { firstName: '', lastName: '', company: '', email: '', phone: '' }]).map((contact, idx) => (
              <div key={`${contact.email}-${idx}`} className="grid grid-cols-[20%_20%_35%_25%] border-b border-slate-200 last:border-b-0">
                <div className="border-r border-slate-200 px-[10px] py-[9px]">{dataCell(contact.firstName)}</div>
                <div className="border-r border-slate-200 px-[10px] py-[9px]">{dataCell(contact.lastName)}</div>
                <div className="border-r border-slate-200 px-[10px] py-[9px]">{dataCell(contact.email)}</div>
                <div className="px-[10px] py-[9px]">{dataCell(contact.phone)}</div>
              </div>
            ))}
          </div>

          <div className="mb-[7px] mt-[18px] text-[10.4px] font-bold text-slate-900">Banking Information</div>
          <div className="border border-slate-300">
            <div className="grid grid-cols-[15%_35%_30%_20%] border-b border-slate-200 bg-slate-50">
              {['Currency', 'Bank', 'Account Number', 'SWIFT'].map((label, index) => (
                <div key={label} className={`px-[10px] py-[9px] font-bold text-slate-900 ${index < 3 ? 'border-r border-slate-300' : ''}`}>{label}</div>
              ))}
            </div>
            {(data.schedule1.bankAccounts.length ? data.schedule1.bankAccounts : [{ currency: '', accountHolder: '', accountNumber: '', swiftCode: '' }, { currency: '', accountHolder: '', accountNumber: '', swiftCode: '' }, { currency: '', accountHolder: '', accountNumber: '', swiftCode: '' }, { currency: '', accountHolder: '', accountNumber: '', swiftCode: '' }]).map((account, idx) => (
              <div key={`${account.currency}-${idx}`} className="grid grid-cols-[15%_35%_30%_20%] border-b border-slate-200 last:border-b-0">
                <div className="border-r border-slate-200 px-[10px] py-[9px]">{dataCell(account.currency)}</div>
                <div className="border-r border-slate-200 px-[10px] py-[9px]">{dataCell(account.accountHolder)}</div>
                <div className="border-r border-slate-200 px-[10px] py-[9px]">{dataCell(account.accountNumber)}</div>
                <div className="px-[10px] py-[9px]">{dataCell(account.swiftCode)}</div>
              </div>
            ))}
          </div>
        </>,
        5,
        totalPages,
        docRef,
        envelopeId,
      )}

      {pageShell(
        <>
          <h3 className="mb-[10px] mt-[18px] border-b border-slate-200 pb-[6px] text-[13px] font-bold tracking-[0.02em] text-slate-900">SIGNATURE & EXECUTION PAGE</h3>
          <p className="mb-2 text-justify">
            This Agreement is executed by duly authorized signatories and may be executed electronically. Digital signatures, audit records, platform acknowledgements, and DocuSign identifiers shall constitute legally binding evidence of execution.
          </p>

          <div className="mt-[22px] flex justify-between gap-6">
            <div className="min-h-[160px] w-[48%] rounded-[4px] border border-slate-200 bg-slate-50 p-4">
              <div className="mb-6 text-[10px] font-bold text-slate-900">For and on behalf of Melenco</div>
              <div className="mb-[6px] mt-6 border-b border-slate-400" />
              <div className="text-[8.5px] text-slate-500">Authorized Signatory</div>
              <div className="mb-[6px] mt-6 border-b border-slate-400" />
              <div className="text-[8.5px] text-slate-500">Title</div>
              <div className="mb-[6px] mt-6 border-b border-slate-400" />
              <div className="text-[8.5px] text-slate-500">Date</div>
              <div className="mt-3 text-[8px] text-slate-400">DocuSign Envelope ID: {envelopeId}</div>
            </div>
            <div className="min-h-[160px] w-[48%] rounded-[4px] border border-slate-200 bg-slate-50 p-4">
              <div className="mb-6 text-[10px] font-bold text-slate-900">For and on behalf of the Seller</div>
              <div className="mb-[6px] mt-6 border-b border-slate-400" />
              <div className="text-[8.5px] text-slate-500">Authorized Signatory</div>
              <div className="mb-[6px] mt-6 border-b border-slate-400" />
              <div className="text-[8.5px] text-slate-500">Title</div>
              <div className="mb-[6px] mt-6 border-b border-slate-400" />
              <div className="text-[8.5px] text-slate-500">Date</div>
            </div>
          </div>
          <div className="mt-4 text-[8px] font-bold text-teal-700">Execution Reference: {docRef}-EXEC</div>
        </>,
        6,
        totalPages,
        docRef,
        envelopeId,
      )}
    </div>
  );
}


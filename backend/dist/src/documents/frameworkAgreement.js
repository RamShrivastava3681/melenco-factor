"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = FrameworkAgreementDocument;
const jsx_runtime_1 = require("react/jsx-runtime");
const renderer_1 = require("@react-pdf/renderer");
const BRAND = {
    navy: '#0b1f3a',
    teal: '#0f766e',
    slate: '#64748b',
    border: '#dbe3ea',
    soft: '#f8fafc',
    text: '#111827',
};
const styles = renderer_1.StyleSheet.create({
    page: {
        paddingTop: 92,
        paddingBottom: 70,
        paddingHorizontal: 52,
        fontFamily: 'Helvetica',
        fontSize: 9.7,
        lineHeight: 1.58,
        color: BRAND.text,
        backgroundColor: '#ffffff',
    },
    watermark: {
        position: 'absolute',
        top: '42%',
        left: '24%',
        fontSize: 54,
        color: '#eef2f7',
        transform: 'rotate(-32deg)',
        opacity: 0.5,
        letterSpacing: 10,
        fontFamily: 'Helvetica-Bold',
    },
    topLabel: {
        fontSize: 8,
        color: '#94a3b8',
        marginBottom: 12,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
    },
    header: {
        position: 'absolute',
        top: 24,
        left: 52,
        right: 52,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#cbd5e1',
        paddingBottom: 10,
        backgroundColor: '#ffffff',
    },
    headerLogo: {
        fontSize: 12,
        fontFamily: 'Helvetica-Bold',
        color: BRAND.teal,
        letterSpacing: 1.1,
    },
    headerTitle: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        color: BRAND.navy,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    title: {
        fontSize: 22,
        textAlign: 'center',
        fontFamily: 'Helvetica-Bold',
        color: BRAND.navy,
        letterSpacing: 2,
        marginTop: 18,
        marginBottom: 6,
    },
    subtitle: {
        textAlign: 'center',
        fontSize: 11,
        color: BRAND.slate,
        letterSpacing: 1,
        marginBottom: 18,
        fontFamily: 'Helvetica-Bold',
    },
    introBlock: {
        backgroundColor: BRAND.soft,
        borderLeftWidth: 3,
        borderLeftColor: BRAND.teal,
        padding: 14,
        marginTop: 16,
        marginBottom: 22,
    },
    heading: {
        fontSize: 13,
        fontFamily: 'Helvetica-Bold',
        color: BRAND.navy,
        marginTop: 18,
        marginBottom: 10,
        borderBottomWidth: 0.8,
        borderBottomColor: '#e2e8f0',
        paddingBottom: 6,
        letterSpacing: 0.3,
    },
    largeHeading: {
        fontSize: 15,
        fontFamily: 'Helvetica-Bold',
        color: BRAND.navy,
        marginTop: 18,
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
        borderBottomWidth: 1,
        borderBottomColor: '#cbd5e1',
        paddingBottom: 8,
    },
    subheading: {
        fontSize: 10.4,
        fontFamily: 'Helvetica-Bold',
        color: BRAND.navy,
        marginTop: 12,
        marginBottom: 7,
    },
    paragraph: {
        textAlign: 'justify',
        marginBottom: 8,
        orphans: 3,
        widows: 3,
    },
    introParagraph: {
        textAlign: 'justify',
        fontSize: 9,
        color: BRAND.slate,
        lineHeight: 1.5,
        marginBottom: 18,
    },
    divider: {
        height: 1,
        backgroundColor: '#e2e8f0',
        marginTop: 18,
        marginBottom: 12,
    },
    clause: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 7,
    },
    clauseNumber: {
        width: 42,
        fontFamily: 'Helvetica-Bold',
        color: BRAND.navy,
        fontSize: 9.5,
        letterSpacing: 0.2,
    },
    clauseText: {
        width: '92%',
        textAlign: 'justify',
    },
    table: {
        borderWidth: 0.8,
        borderColor: BRAND.border,
        marginTop: 10,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 0.7,
        borderBottomColor: '#e5e7eb',
    },
    tableHeaderCell: {
        paddingTop: 9,
        paddingBottom: 9,
        paddingHorizontal: 10,
        backgroundColor: '#f8fafc',
        fontFamily: 'Helvetica-Bold',
        color: BRAND.navy,
        borderRightWidth: 0.6,
        borderRightColor: BRAND.border,
    },
    tableCell: {
        paddingTop: 9,
        paddingBottom: 9,
        paddingHorizontal: 10,
        borderRightWidth: 0.6,
        borderRightColor: '#e5e7eb',
        textAlign: 'left',
    },
    lastCell: {
        borderRightWidth: 0,
    },
    footer: {
        position: 'absolute',
        bottom: 22,
        left: 52,
        right: 52,
        borderTopWidth: 0.8,
        borderTopColor: '#d1d5db',
        paddingTop: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        fontFamily: 'Helvetica',
        fontSize: 7.8,
        color: '#64748b',
        letterSpacing: 0.4,
    },
    signatureBlock: {
        borderWidth: 0.8,
        borderColor: '#d1d5db',
        padding: 16,
        marginTop: 18,
        borderRadius: 6,
        backgroundColor: '#fcfcfd',
        minHeight: 150,
    },
    signatureRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 18,
        gap: 16,
    },
    signatureHalf: {
        width: '48%',
        borderWidth: 0.8,
        borderColor: '#d1d5db',
        padding: 16,
        borderRadius: 6,
        backgroundColor: '#fcfcfd',
        minHeight: 170,
    },
    signatureLine: {
        borderBottomWidth: 1,
        borderBottomColor: '#64748b',
        marginTop: 28,
        marginBottom: 10,
    },
    signatureSmall: {
        fontSize: 8.5,
        color: BRAND.slate,
    },
    executionRef: {
        marginTop: 16,
        color: BRAND.teal,
        fontFamily: 'Helvetica-Bold',
    },
    defTable: {
        borderWidth: 0.8,
        borderColor: BRAND.border,
        marginTop: 10,
    },
    defRow: {
        flexDirection: 'row',
        borderBottomWidth: 0.7,
        borderBottomColor: '#e5e7eb',
    },
    defTermCell: {
        width: '28%',
        paddingTop: 9,
        paddingBottom: 9,
        paddingHorizontal: 10,
        backgroundColor: '#f8fafc',
        borderRightWidth: 0.6,
        borderRightColor: BRAND.border,
    },
    defTextCell: {
        width: '72%',
        paddingTop: 9,
        paddingBottom: 9,
        paddingHorizontal: 10,
    },
    defTermText: {
        fontFamily: 'Helvetica-Bold',
        color: BRAND.navy,
        fontSize: 9.5,
    },
    defTextText: {
        textAlign: 'justify',
        fontSize: 9.3,
        lineHeight: 1.45,
    },
});
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
    ['Intellectual Property', 'All proprietary rights relating to the Platform, software, branding, and documentation of WHIZUNIK.'],
    ['Invoice', 'A valid and undisputed invoice issued by the Seller to a Buyer for goods or services delivered in accordance with the Underlying Relationship.'],
    ['Late Fee', 'A monthly compounding servicing fee applied to amounts outstanding beyond the Due Date.'],
    ['Payment Term', 'The agreed period between the invoice date and the Due Date.'],
    ['Platform', 'The WHIZUNIK digital platform through which receivables purchase transactions are initiated, confirmed, and serviced.'],
    ['Political Risk', 'Any sovereign, regulatory, or geopolitical event affecting payment or transfer of funds by a Buyer.'],
    ['Portfolio', 'The aggregate of Accounts Receivable purchased by WHIZUNIK from the Seller.'],
    ['Processing Fee', 'A fee charged for operational processing, verification, and platform administration.'],
    ['Purchase Price', 'The sum of the Initial Purchase Price and the Deferred Purchase Price for an Account Receivable.'],
    ['Related Rights', 'All rights, remedies, proceeds, and insurance relating to an Account Receivable.'],
    ['Repurchase Price', 'The amount payable by the Seller to repurchase an Account Receivable upon a State of Default.'],
    ['Schedule', 'Any schedule attached to this Agreement, including Schedule 1 and Schedule 2.'],
    ['Security Interest', 'Any pledge, charge, assignment by way of security, or other security interest.'],
    ['Seller Account', 'The verified bank account maintained by the Seller and recorded on the Platform.'],
    ['Set-Up Fee', 'A one-time onboarding fee deducted from the first disbursement.'],
    ['State of Default', 'Any event defined in this Agreement that gives WHIZUNIK the right to suspend purchases or demand repurchase.'],
    ['Transaction Fee', 'The fee applied on each purchased Account Receivable.'],
    ['Transfer', 'The assignment, sale, or transfer of an Account Receivable to WHIZUNIK.'],
    ['Underlying Relationship', 'The contract, purchase order, or commercial relationship between Seller and Buyer giving rise to the Invoice.'],
];
const displayValue = (value) => value?.trim() || '-';
const Watermark = () => (0, jsx_runtime_1.jsx)(renderer_1.Text, { fixed: true, style: styles.watermark, children: "WHIZUNIK" });
const Header = ({ title }) => ((0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.header, fixed: true, children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.headerLogo, children: "WHIZUNIK" }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.headerTitle, children: title })] }));
const Footer = ({ docRef, envelopeId }) => ((0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.footer, fixed: true, children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { children: "WHIZUNIK Confidential" }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { render: ({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}` }), (0, jsx_runtime_1.jsxs)(renderer_1.Text, { children: [docRef, " | ", envelopeId] })] }));
const LegalPage = ({ title, children, docRef, envelopeId }) => ((0, jsx_runtime_1.jsxs)(renderer_1.Page, { size: "A4", style: styles.page, children: [(0, jsx_runtime_1.jsx)(Header, { title: title }), (0, jsx_runtime_1.jsx)(Watermark, {}), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.topLabel, children: "Trade Finance Documentation - Confidential" }), children, (0, jsx_runtime_1.jsx)(Footer, { docRef: docRef, envelopeId: envelopeId })] }));
const Clause = ({ number, text }) => ((0, jsx_runtime_1.jsxs)(renderer_1.View, { wrap: false, style: styles.clause, children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.clauseNumber, children: number }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.clauseText, children: text })] }));
const TableRow = ({ cells, widths, header = false }) => ((0, jsx_runtime_1.jsx)(renderer_1.View, { style: styles.tableRow, wrap: false, children: cells.map((cell, idx) => {
        const width = widths[idx] ?? `${Math.floor(100 / Math.max(cells.length, 1))}%`;
        return ((0, jsx_runtime_1.jsx)(renderer_1.Text, { style: [
                header ? styles.tableHeaderCell : styles.tableCell,
                { width },
                idx === cells.length - 1 ? styles.lastCell : {},
            ], children: displayValue(cell) }, `${cell}-${idx}`));
    }) }));
const DefinitionItem = ({ term, definition }) => ((0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.defRow, wrap: false, children: [(0, jsx_runtime_1.jsx)(renderer_1.View, { style: styles.defTermCell, children: (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.defTermText, children: term }) }), (0, jsx_runtime_1.jsx)(renderer_1.View, { style: styles.defTextCell, children: (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.defTextText, children: definition }) })] }));
function FrameworkAgreementDocument({ data }) {
    const docRef = data?.docRef?.trim() || 'WHZ-FA-2026-05';
    const envelopeId = data?.envelopeId?.trim() || 'DS-8A3E-4F1C-9B2D-57A0';
    const transactionFeeRows = data?.transactionFeeTiers?.length
        ? data.transactionFeeTiers
        : [{ range: '', fee: '' }, { range: '', fee: '' }, { range: '', fee: '' }, { range: '', fee: '' }];
    const contacts = data?.schedule1?.primaryContacts?.length
        ? data.schedule1.primaryContacts
        : [{ firstName: '', lastName: '', email: '', phone: '' }, { firstName: '', lastName: '', email: '', phone: '' }];
    const bankAccounts = data?.schedule1?.bankAccounts?.length
        ? data.schedule1.bankAccounts
        : [
            { currency: '', accountHolder: '', accountNumber: '', swiftCode: '' },
            { currency: '', accountHolder: '', accountNumber: '', swiftCode: '' },
            { currency: '', accountHolder: '', accountNumber: '', swiftCode: '' },
            { currency: '', accountHolder: '', accountNumber: '', swiftCode: '' },
        ];
    return ((0, jsx_runtime_1.jsxs)(renderer_1.Document, { title: "WHIZUNIK Framework Agreement", author: "WHIZUNIK", subject: "Trade Finance Framework Agreement", children: [(0, jsx_runtime_1.jsxs)(LegalPage, { title: "Framework Agreement", docRef: docRef, envelopeId: envelopeId, children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.title, children: "FRAMEWORK AGREEMENT" }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.subtitle, children: "Seller Financing Agreement" }), (0, jsx_runtime_1.jsx)(renderer_1.View, { style: styles.introBlock, children: (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.paragraph, children: "This Framework Agreement (\"Agreement\") is entered into between whizunik, a company incorporated under the laws of India and engaged in international trade finance, receivables financing, invoice factoring, export finance, and supply chain financing solutions, and the Seller identified below." }) }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.heading, children: "Seller Identification" }), (0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.table, children: [(0, jsx_runtime_1.jsx)(TableRow, { header: true, widths: ['35%', '65%'], cells: ['Field', 'Details'] }), (0, jsx_runtime_1.jsx)(TableRow, { widths: ['35%', '65%'], cells: ['Legal Entity Name', data?.seller?.name || ''] }), (0, jsx_runtime_1.jsx)(TableRow, { widths: ['35%', '65%'], cells: ['Registered Office', data?.seller?.address || ''] }), (0, jsx_runtime_1.jsx)(TableRow, { widths: ['35%', '65%'], cells: ['GST Number', data?.sellerTaxId || ''] }), (0, jsx_runtime_1.jsx)(TableRow, { widths: ['35%', '65%'], cells: ['CIN', data?.sellerCorporateId || ''] }), (0, jsx_runtime_1.jsx)(TableRow, { widths: ['35%', '65%'], cells: ['Contact Person', data?.sellerContactPerson || ''] }), (0, jsx_runtime_1.jsx)(TableRow, { widths: ['35%', '65%'], cells: ['Email Address', data?.sellerEmail || ''] }), (0, jsx_runtime_1.jsx)(TableRow, { widths: ['35%', '65%'], cells: ['Telephone Number', data?.sellerPhone || ''] })] }), (0, jsx_runtime_1.jsx)(renderer_1.View, { style: styles.divider }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.heading, children: "1. Scope of Framework Agreement" }), (0, jsx_runtime_1.jsx)(Clause, { number: "1.1", text: "Seller wishes to utilize trade finance solutions offered through the WHIZUNIK Platform, including receivables financing, export financing, invoice factoring, seller financing, purchase order financing, and supply chain liquidity solutions." }), (0, jsx_runtime_1.jsx)(Clause, { number: "1.2", text: "This Agreement governs all receivables purchase transactions executed between WHIZUNIK and the Seller and establishes the commercial, legal, operational, technological, and compliance framework applicable to all approved financing transactions." }), (0, jsx_runtime_1.jsx)(Clause, { number: "1.3", text: "The Seller acknowledges that access to WHIZUNIK financing products remains subject to internal underwriting standards, sanctions screening, anti-money laundering checks, portfolio concentration limits, and ongoing risk monitoring procedures." }), (0, jsx_runtime_1.jsx)(renderer_1.View, { style: styles.divider }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.heading, children: "2. Payment Terms and Fees" }), (0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.table, children: [(0, jsx_runtime_1.jsx)(TableRow, { header: true, widths: ['25%', '25%', '25%', '25%'], cells: ['Payment Term', 'Transaction Fee', 'Factoring Fee', 'Advance Rate'] }), transactionFeeRows.map((tier, idx) => ((0, jsx_runtime_1.jsx)(TableRow, { widths: ['25%', '25%', '25%', '25%'], cells: [tier.range, tier.fee, data?.factoringFee || '', data?.advanceRate || ''] }, `${tier.range}-${idx}`)))] }), (0, jsx_runtime_1.jsx)(Clause, { number: "2.1", text: "All Fees disclosed by WHIZUNIK shall be deemed commercially confidential and may vary based on Buyer risk profile, jurisdiction, transaction tenor, trade corridor exposure, and portfolio concentration metrics." }), (0, jsx_runtime_1.jsx)(Clause, { number: "2.2", text: "WHIZUNIK reserves the right to revise pricing structures, treasury spreads, processing charges, and operational fees in response to market conditions, funding costs, and regulatory changes." }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.heading, children: "Execution" }), (0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.signatureBlock, children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.subheading, children: "For and on behalf of whizunik" }), (0, jsx_runtime_1.jsx)(renderer_1.View, { style: styles.signatureLine }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { children: "Authorized Signatory" }), (0, jsx_runtime_1.jsx)(renderer_1.View, { style: styles.signatureLine }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { children: "Date & Place" }), (0, jsx_runtime_1.jsx)(renderer_1.View, { style: styles.signatureLine }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { children: "Seller Signature" })] })] }), (0, jsx_runtime_1.jsxs)(LegalPage, { title: "Receivables Purchase Terms & Conditions", docRef: docRef, envelopeId: envelopeId, children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.largeHeading, children: "Receivables Purchase Terms and Conditions (RPTC)" }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.introParagraph, children: "These Receivables Purchase Terms and Conditions form an integral part of the Framework Agreement and apply to each receivables purchase transaction executed on the WHIZUNIK Platform." }), (0, jsx_runtime_1.jsx)(renderer_1.View, { style: styles.defTable, children: DEFINITION_ITEMS.map(([term, definition]) => ((0, jsx_runtime_1.jsx)(DefinitionItem, { term: term, definition: definition }, term))) })] }), (0, jsx_runtime_1.jsxs)(LegalPage, { title: "Framework Agreement", docRef: docRef, envelopeId: envelopeId, children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.heading, children: "4. Offer" }), (0, jsx_runtime_1.jsx)(Clause, { number: "4.1", text: "The Seller may upload Invoices, shipping records, purchase orders, delivery confirmations, trade documentation, customs declarations, inspection certificates, and related supporting materials onto the Platform for the purpose of offering Accounts Receivable for purchase by WHIZUNIK." }), (0, jsx_runtime_1.jsx)(Clause, { number: "4.2", text: "Submission of an Invoice through the Platform constitutes a legally binding offer by the Seller to sell, assign, and transfer the relevant Account Receivable together with all Related Rights to WHIZUNIK in accordance with this Agreement." }), (0, jsx_runtime_1.jsx)(Clause, { number: "4.3", text: "WHIZUNIK may review, verify, evaluate, approve, conditionally approve, suspend, or reject any proposed transaction in its sole discretion taking into account underwriting standards, sanctions screening, compliance checks, portfolio concentration limits, and internal credit assessment criteria." }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.heading, children: "5. Sale and Purchase of Accounts Receivable" }), (0, jsx_runtime_1.jsx)(Clause, { number: "5.1", text: "Upon acceptance by WHIZUNIK, the Seller irrevocably sells, assigns, transfers, conveys, and grants to WHIZUNIK all legal and beneficial rights, title, and interest in and to the relevant Accounts Receivable together with all Related Rights." }), (0, jsx_runtime_1.jsx)(Clause, { number: "5.2", text: "The Parties acknowledge and agree that each Transfer is intended to constitute a true sale transaction and not merely the creation of security." }), (0, jsx_runtime_1.jsx)(Clause, { number: "5.3", text: "The Seller shall promptly notify WHIZUNIK upon becoming aware of Buyer disputes, offsets, counterclaims, credit notes, delayed shipments, payment delays, defective goods, sanctions concerns, or any event affecting collectability." })] }), (0, jsx_runtime_1.jsxs)(LegalPage, { title: "Framework Agreement", docRef: docRef, envelopeId: envelopeId, children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.heading, children: "6. Payment of Purchase Price" }), (0, jsx_runtime_1.jsx)(Clause, { number: "6.1", text: "Subject to the terms and conditions of this Agreement, WHIZUNIK shall disburse the Initial Purchase Price to the Seller Account on the applicable Purchase Date following approval and acceptance of the relevant Account Receivable." }), (0, jsx_runtime_1.jsx)(Clause, { number: "6.2", text: "The Deferred Purchase Price shall become payable only after Collection of the relevant Account Receivable by WHIZUNIK and after deduction of all Fees, adjustments, treasury spreads, legal costs, recovery expenses, taxes, and other applicable amounts." }), (0, jsx_runtime_1.jsx)(Clause, { number: "6.3", text: "All payments under this Agreement shall be made in the currency of the relevant Invoice unless WHIZUNIK agrees otherwise or applicable law requires currency conversion." }), (0, jsx_runtime_1.jsx)(Clause, { number: "6.4", text: "If any payment relating to a transferred Account Receivable is mistakenly received by the Seller, the Seller shall hold such funds in trust for WHIZUNIK and remit the same within two Business Days." })] }), (0, jsx_runtime_1.jsxs)(LegalPage, { title: "Schedule 1", docRef: docRef, envelopeId: envelopeId, children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.heading, children: "SCHEDULE 1 - Contact and Bank Account Details" }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.subheading, children: "Primary Contact Persons" }), (0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.table, children: [(0, jsx_runtime_1.jsx)(TableRow, { header: true, widths: ['20%', '20%', '35%', '25%'], cells: ['First Name', 'Last Name', 'Email', 'Phone Number'] }), contacts.map((contact, idx) => ((0, jsx_runtime_1.jsx)(TableRow, { widths: ['20%', '20%', '35%', '25%'], cells: [contact.firstName, contact.lastName, contact.email, contact.phone] }, `${contact.email}-${idx}`)))] }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.subheading, children: "Banking Information" }), (0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.table, children: [(0, jsx_runtime_1.jsx)(TableRow, { header: true, widths: ['15%', '35%', '30%', '20%'], cells: ['Currency', 'Bank', 'Account Number', 'SWIFT'] }), bankAccounts.map((account, idx) => ((0, jsx_runtime_1.jsx)(TableRow, { widths: ['15%', '35%', '30%', '20%'], cells: [account.currency, account.accountHolder, account.accountNumber, account.swiftCode] }, `${account.currency}-${idx}`)))] })] }), (0, jsx_runtime_1.jsxs)(LegalPage, { title: "Execution Page", docRef: docRef, envelopeId: envelopeId, children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.heading, children: "SIGNATURE & EXECUTION PAGE" }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.paragraph, children: "This Agreement is executed by duly authorized signatories and may be executed electronically. Digital signatures, audit records, platform acknowledgements, and DocuSign identifiers shall constitute legally binding evidence of execution." }), (0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.signatureRow, children: [(0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.signatureHalf, children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.subheading, children: "For and on behalf of whizunik" }), (0, jsx_runtime_1.jsx)(renderer_1.View, { style: styles.signatureLine }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.signatureSmall, children: "Authorized Signatory" }), (0, jsx_runtime_1.jsx)(renderer_1.View, { style: styles.signatureLine }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.signatureSmall, children: "Title" }), (0, jsx_runtime_1.jsx)(renderer_1.View, { style: styles.signatureLine }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.signatureSmall, children: "Date" }), (0, jsx_runtime_1.jsxs)(renderer_1.Text, { style: styles.signatureSmall, children: ["DocuSign Envelope ID: ", envelopeId] })] }), (0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.signatureHalf, children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.subheading, children: "For and on behalf of the Seller" }), (0, jsx_runtime_1.jsx)(renderer_1.View, { style: styles.signatureLine }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.signatureSmall, children: "Authorized Signatory" }), (0, jsx_runtime_1.jsx)(renderer_1.View, { style: styles.signatureLine }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.signatureSmall, children: "Title" }), (0, jsx_runtime_1.jsx)(renderer_1.View, { style: styles.signatureLine }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.signatureSmall, children: "Date" })] })] }), (0, jsx_runtime_1.jsxs)(renderer_1.Text, { style: styles.executionRef, children: ["Execution Reference: ", docRef, "-EXEC"] })] })] }));
}
//# sourceMappingURL=frameworkAgreement.js.map
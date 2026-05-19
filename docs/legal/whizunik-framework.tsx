import React from 'react';
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';

const BRAND = {
  navy: '#0b1f3a',
  teal: '#0f766e',
  slate: '#64748b',
  border: '#dbe3ea',
  soft: '#f8fafc',
  text: '#111827',
};

const DOC_REF = 'WHZ-FA-2026-05';
const ENVELOPE_ID = 'DS-8A3E-4F1C-9B2D-57A0';

const styles = StyleSheet.create({
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

  definitionTerm: {
    width: '28%',
    fontFamily: 'Helvetica-Bold',
    color: BRAND.navy,
    paddingRight: 10,
  },

  definitionText: {
    width: '72%',
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

  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#64748b',
    marginTop: 28,
    marginBottom: 10,
  },

  listItem: {
    flexDirection: 'row',
    marginLeft: 12,
    marginBottom: 4,
  },

  listBullet: {
    width: 10,
    fontFamily: 'Helvetica-Bold',
  },

  listText: {
    flex: 1,
    textAlign: 'justify',
  },
});

const Watermark = () => (
  <Text fixed style={styles.watermark}>
    WHIZUNIK
  </Text>
);

const Header = ({ title }: { title: string }) => (
  <View style={styles.header} fixed>
    <Text style={styles.headerLogo}>WHIZUNIK</Text>
    <Text style={styles.headerTitle}>{title}</Text>
  </View>
);

const Footer = () => (
  <View style={styles.footer} fixed>
    <Text>WHIZUNIK Confidential</Text>
    <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
    <Text>{DOC_REF} | {ENVELOPE_ID}</Text>
  </View>
);

const LegalPage = ({ title, children }: any) => (
  <Page size="A4" style={styles.page}>
    <Header title={title} />
    <Watermark />
    <Text style={styles.topLabel}>
      Trade Finance Documentation — Confidential
    </Text>
    {children}
    <Footer />
  </Page>
);

const Clause = ({ number, text, listItems }: any) => (
  <View wrap={false}>
    <View style={styles.clause}>
      <Text style={styles.clauseNumber}>{number}</Text>
      <Text style={styles.clauseText}>{text}</Text>
    </View>

    {listItems?.map((item: string, index: number) => (
      <View key={index} style={styles.listItem}>
        <Text style={styles.listBullet}>•</Text>
        <Text style={styles.listText}>{item}</Text>
      </View>
    ))}
  </View>
);

const DefinitionItem = ({ term, definition }: any) => (
  <View style={styles.clause} wrap={false}>
    <Text style={styles.definitionTerm}>{term}</Text>
    <Text style={styles.definitionText}>{definition}</Text>
  </View>
);

const TableRow = ({ cells, widths, header }: any) => (
  <View style={styles.tableRow} wrap={false}>
    {cells.map((cell: string, idx: number) => (
      <Text
        key={idx}
        style={[
          header ? styles.tableHeaderCell : styles.tableCell,
          { width: widths[idx] },
          idx === cells.length - 1 ? styles.lastCell : {},
        ]}
      >
        {cell}
      </Text>
    ))}
  </View>
);

export default function FrameworkAgreementDocument() {
  return (
    <Document
      title="WHIZUNIK Framework Agreement"
      author="WHIZUNIK"
      subject="Trade Finance Framework Agreement"
    >
      <LegalPage title="Framework Agreement">
        <Text style={styles.title}>FRAMEWORK AGREEMENT</Text>
        <Text style={styles.subtitle}>Seller Financing Agreement</Text>

        <View style={styles.introBlock}>
          <Text style={styles.paragraph}>
            This Framework Agreement (“Agreement”) is entered into between whizunik,
            a company incorporated under the laws of India and engaged in international trade finance,
            receivables financing, invoice factoring, export finance, and supply chain financing solutions,
            and the Seller identified below.
          </Text>
        </View>

        <Text style={styles.heading}>Seller Identification</Text>

        <View style={styles.table}>
          <TableRow
            header
            widths={['35%', '65%']}
            cells={['Field', 'Details']}
          />

          <TableRow widths={['35%', '65%']} cells={['Legal Entity Name', 'LAJ EXPORTS LIMITED']} />
          <TableRow widths={['35%', '65%']} cells={['Registered Office', 'Chandan Hulla Khasra No. 150, New Delhi, India']} />
          <TableRow widths={['35%', '65%']} cells={['GST Number', '09AAACL9688G2ZW']} />
          <TableRow widths={['35%', '65%']} cells={['CIN', 'U74999DL2018PTC000000']} />
          <TableRow widths={['35%', '65%']} cells={['Contact Person', 'Naresh Aneja']} />
          <TableRow widths={['35%', '65%']} cells={['Email Address', 'naresh@lajexports.com']} />
          <TableRow widths={['35%', '65%']} cells={['Telephone Number', '+91 9811013606']} />
        </View>

        <View style={styles.divider} />

        <Text style={styles.heading}>1. Scope of Framework Agreement</Text>

        <Clause
          number="1.1"
          text="Seller wishes to utilize trade finance solutions offered through the WHIZUNIK Platform, including receivables financing, export financing, invoice factoring, seller financing, purchase order financing, and supply chain liquidity solutions."
        />

        <Clause
          number="1.2"
          text="This Agreement governs all receivables purchase transactions executed between WHIZUNIK and the Seller and establishes the commercial, legal, operational, technological, and compliance framework applicable to all approved financing transactions."
        />

        <Clause
          number="1.3"
          text="The Seller acknowledges that access to WHIZUNIK financing products remains subject to internal underwriting standards, sanctions screening, anti-money laundering checks, portfolio concentration limits, and ongoing risk monitoring procedures."
        />

        <View style={styles.divider} />

        <Text style={styles.heading}>2. Payment Terms and Fees</Text>

        <View style={styles.table}>
          <TableRow
            header
            widths={['25%', '25%', '25%', '25%']}
            cells={['Payment Term', 'Transaction Fee', 'Factoring Fee', 'Advance Rate']}
          />

          <TableRow widths={['25%', '25%', '25%', '25%']} cells={['0–30 Days', '0.47%', '0.94%', '90%']} />
          <TableRow widths={['25%', '25%', '25%', '25%']} cells={['31–60 Days', '1.41%', '1.20%', '88%']} />
          <TableRow widths={['25%', '25%', '25%', '25%']} cells={['61–90 Days', '2.20%', '1.45%', '85%']} />
          <TableRow widths={['25%', '25%', '25%', '25%']} cells={['91–120 Days', '3.10%', '1.85%', '80%']} />
        </View>

        <Clause
          number="2.1"
          text="All Fees disclosed by WHIZUNIK shall be deemed commercially confidential and may vary based on Buyer risk profile, jurisdiction, transaction tenor, trade corridor exposure, and portfolio concentration metrics."
        />

        <Clause
          number="2.2"
          text="WHIZUNIK reserves the right to revise pricing structures, treasury spreads, processing charges, and operational fees in response to market conditions, funding costs, and regulatory changes."
        />

        <Text style={styles.heading}>Execution</Text>

        <View style={styles.signatureBlock}>
          <Text style={styles.subheading}>For and on behalf of whizunik</Text>

          <View style={styles.signatureLine} />
          <Text>Authorized Signatory</Text>

          <View style={styles.signatureLine} />
          <Text>Date & Place</Text>

          <View style={styles.signatureLine} />
          <Text>Seller Signature</Text>
        </View>
      </LegalPage>

      <LegalPage title="Receivables Purchase Terms & Conditions">
        <Text style={styles.paragraph}>
          These Receivables Purchase Terms and Conditions form an integral part of the Framework Agreement and apply to each receivables purchase transaction executed on the WHIZUNIK Platform.
        </Text>

        <Text style={styles.heading}>3. Definitions and Interpretation</Text>

        <DefinitionItem term="Account Receivable" definition="means the
right to receive any and all present and future payments of
money due and payable, whether due now or payable in the
future (including any entitlement to late payment interest
whether by contract or implied by law) as a result of an
Underlying Relationship, whether or not earned by
performance. If the amount due under an Invoice is payable
in instalments, each such instalment shall be treated as an
individual Account Receivable." />
        <DefinitionItem term="Addendum" definition="Any supplemental document or schedule agreed by the Parties that modifies or expands the terms of this Agreement." />
        <DefinitionItem term="Advance Rate" definition="The percentage of the Invoice value paid as the Initial Purchase Price upon acceptance of an Account Receivable." />
        <DefinitionItem term="Adverse Claim" definition="Any lien, security interest, charge, encumbrance, or other claim that adversely affects the Seller's title to an Account Receivable." />
        <DefinitionItem term="Agreement" definition="This Framework Agreement together with the RPTC, Schedules, Addenda, and any Transaction Confirmations." />
        <DefinitionItem term="Applicable Law" definition="All laws, regulations, rules, sanctions, and regulatory guidance applicable to the Parties, the Platform, or the Accounts Receivable." />
        <DefinitionItem term="Buyer" definition="The obligor identified on the Invoice who owes payment for the underlying goods or services." />
        <DefinitionItem term="Collection" definition="Any payment, credit, set-off, or other settlement received in respect of an Account Receivable." />
        <DefinitionItem term="Deferred Purchase Price" definition="The balance of the Purchase Price payable to the Seller after Collection, net of Fees and adjustments." />
        <DefinitionItem term="Due Date" definition="The date on which payment of an Account Receivable becomes contractually due under the Underlying Relationship." />
        <DefinitionItem term="Event of Insolvency" definition="Any insolvency, bankruptcy, winding up, or analogous proceeding affecting the Seller or a Buyer." />
        <DefinitionItem term="Factoring Fee" definition="The fee charged for financing and servicing Accounts Receivable as set out in the Transaction Confirmation." />
        <DefinitionItem term="Fees" definition="Collectively, the Transaction Fee, Factoring Fee, Processing Fee, Set-Up Fee, Late Fee, and any other charges disclosed on the Platform." />
        <DefinitionItem term="Initial Purchase Price" definition="The portion of the Purchase Price paid to the Seller on the Purchase Date." />
        <DefinitionItem term="Intellectual Property" definition="All proprietary rights relating to the Platform, software, branding, and documentation of WHIZUNIK." />
        <DefinitionItem term="Invoice" definition="A valid and undisputed invoice issued by the Seller to a Buyer for goods or services delivered in accordance with the Underlying Relationship." />
        <DefinitionItem term="Late Fee" definition="A monthly compounding servicing fee applied to amounts outstanding beyond the Due Date." />
        <DefinitionItem term="Payment Term" definition="The agreed period between the invoice date and the Due Date." />
        <DefinitionItem term="Platform" definition="The WHIZUNIK digital platform through which receivables purchase transactions are initiated, confirmed, and serviced." />
        <DefinitionItem term="Political Risk" definition="Any sovereign, regulatory, or geopolitical event affecting payment or transfer of funds by a Buyer." />
        <DefinitionItem term="Portfolio" definition="The aggregate of Accounts Receivable purchased by WHIZUNIK from the Seller." />
        <DefinitionItem term="Processing Fee" definition="A fee charged for operational processing, verification, and platform administration." />
        <DefinitionItem term="Purchase Price" definition="The sum of the Initial Purchase Price and the Deferred Purchase Price for an Account Receivable." />
        <DefinitionItem term="Related Rights" definition="All rights, remedies, proceeds, and insurance relating to an Account Receivable." />
        <DefinitionItem term="Repurchase Price" definition="The amount payable by the Seller to repurchase an Account Receivable upon a State of Default." />
        <DefinitionItem term="Schedule" definition="Any schedule attached to this Agreement, including Schedule 1 and Schedule 2." />
        <DefinitionItem term="Security Interest" definition="Any pledge, charge, assignment by way of security, or other security interest." />
        <DefinitionItem term="Seller Account" definition="The verified bank account maintained by the Seller and recorded on the Platform." />
        <DefinitionItem term="Set-Up Fee" definition="A one-time onboarding fee deducted from the first disbursement." />
        <DefinitionItem term="State of Default" definition="Any event defined in this Agreement that gives WHIZUNIK the right to suspend purchases or demand repurchase." />
        <DefinitionItem term="Transaction Fee" definition="The fee applied on each purchased Account Receivable." />
        <DefinitionItem term="Transfer" definition="The assignment, sale, or transfer of an Account Receivable to WHIZUNIK." />
        <DefinitionItem term="Underlying Relationship" definition="The contract, purchase order, or commercial relationship between Seller and Buyer giving rise to the Invoice." />
      </LegalPage>

      <LegalPage title="Receivables Purchase Terms & Conditions">
        <Text style={styles.heading}>4. Offer</Text>

        <Clause
          number="4.1"
          text="The Seller may upload Invoices, shipping records, purchase orders, delivery confirmations, trade documentation, customs declarations, inspection certificates, and related supporting materials onto the Platform for the purpose of offering Accounts Receivable for purchase by WHIZUNIK."
        />

        <Clause
          number="4.2"
          text="Submission of an Invoice through the Platform constitutes a legally binding offer by the Seller to sell, assign, and transfer the relevant Account Receivable together with all Related Rights to WHIZUNIK in accordance with this Agreement."
        />

        <Clause
          number="4.3"
          text="WHIZUNIK may review, verify, evaluate, approve, conditionally approve, suspend, or reject any proposed transaction in its sole discretion taking into account underwriting standards, sanctions screening, compliance checks, portfolio concentration limits, and internal credit assessment criteria."
        />

        <Text style={styles.heading}>5. Sale and Purchase of Accounts Receivable</Text>

        <Clause
          number="5.1"
          text="Upon acceptance by WHIZUNIK, the Seller irrevocably sells, assigns, transfers, conveys, and grants to WHIZUNIK all legal and beneficial rights, title, and interest in and to the relevant Accounts Receivable together with all Related Rights."
        />

        <Clause
          number="5.2"
          text="The Parties acknowledge and agree that each Transfer is intended to constitute a true sale transaction and not merely the creation of security."
        />

        <Clause
          number="5.3"
          text="The Seller shall promptly notify WHIZUNIK upon becoming aware of Buyer disputes, offsets, counterclaims, credit notes, delayed shipments, payment delays, defective goods, sanctions concerns, or any event affecting collectability."
        />
      </LegalPage>

      <LegalPage title="Receivables Purchase Terms & Conditions">
        <Text style={styles.heading}>6. Payment of Purchase Price</Text>

        <Clause
          number="6.1"
          text="Subject to the terms and conditions of this Agreement, WHIZUNIK shall disburse the Initial Purchase Price to the Seller Account on the applicable Purchase Date following approval and acceptance of the relevant Account Receivable."
        />

        <Clause
          number="6.2"
          text="The Deferred Purchase Price shall become payable only after Collection of the relevant Account Receivable by WHIZUNIK and after deduction of all Fees, adjustments, treasury spreads, legal costs, recovery expenses, taxes, and other applicable amounts."
        />

        <Clause
          number="6.3"
          text="All payments under this Agreement shall be made in the currency of the relevant Invoice unless WHIZUNIK agrees otherwise or applicable law requires currency conversion."
        />

        <Clause
          number="6.4"
          text="If any payment relating to a transferred Account Receivable is mistakenly received by the Seller, the Seller shall hold such funds in trust for WHIZUNIK and remit the same within two Business Days."
        />
      </LegalPage>

      <LegalPage title="Schedule 1">
        <Text style={styles.heading}>SCHEDULE 1 — Contact and Bank Account Details</Text>

        <Text style={styles.subheading}>Primary Contact Persons</Text>

        <View style={styles.table}>
          <TableRow
            header
            widths={['20%', '20%', '35%', '25%']}
            cells={['First Name', 'Last Name', 'Email', 'Phone Number']}
          />

          <TableRow
            widths={['20%', '20%', '35%', '25%']}
            cells={['Aditi', 'Mehra', 'aditi.mehra@lajexports.com', '+91 98 7654 3210']}
          />

          <TableRow
            widths={['20%', '20%', '35%', '25%']}
            cells={['Rahul', 'Nair', 'rahul.nair@lajexports.com', '+91 98 1234 5678']}
          />
        </View>

        <Text style={[styles.subheading, { marginTop: 18 }]}>Banking Information</Text>

        <View style={styles.table}>
          <TableRow
            header
            widths={['15%', '35%', '30%', '20%']}
            cells={['Currency', 'Bank', 'Account Number', 'SWIFT']}
          />

          <TableRow
            widths={['15%', '35%', '30%', '20%']}
            cells={['USD', 'Citibank N.A. New York', '021000045987', 'CITIUS33']}
          />

          <TableRow
            widths={['15%', '35%', '30%', '20%']}
            cells={['EUR', 'Deutsche Bank AG Frankfurt', 'DE98100100001234567890', 'DEUTDEFF']}
          />

          <TableRow
            widths={['15%', '35%', '30%', '20%']}
            cells={['GBP', 'JPMorgan Chase London', 'GB29NWBK60161331926819', 'CHASGB2L']}
          />

          <TableRow
            widths={['15%', '35%', '30%', '20%']}
            cells={['INR', 'HSBC India Mumbai', '091234567890', 'HSBCINBB']}
          />
        </View>
      </LegalPage>

      <LegalPage title="Execution Page">
        <Text style={styles.heading}>SIGNATURE & EXECUTION PAGE</Text>

        <Text style={styles.paragraph}>
          This Agreement is executed by duly authorized signatories and may be executed electronically.
          Digital signatures, audit records, platform acknowledgements, and DocuSign identifiers shall constitute
          legally binding evidence of execution.
        </Text>

        <View style={styles.signatureBlock}>
          <Text style={styles.subheading}>For and on behalf of whizunik</Text>

          <View style={styles.signatureLine} />
          <Text>Authorized Signatory</Text>

          <View style={styles.signatureLine} />
          <Text>Title</Text>

          <View style={styles.signatureLine} />
          <Text>Date</Text>

          <Text style={{ marginTop: 14 }}>
            DocuSign Envelope ID: {ENVELOPE_ID}
          </Text>
        </View>

        <View style={styles.signatureBlock}>
          <Text style={styles.subheading}>For and on behalf of the Seller</Text>

          <View style={styles.signatureLine} />
          <Text>Authorized Signatory</Text>

          <View style={styles.signatureLine} />
          <Text>Title</Text>

          <View style={styles.signatureLine} />
          <Text>Date</Text>
        </View>

        <Text style={{ marginTop: 16, color: BRAND.teal, fontFamily: 'Helvetica-Bold' }}>
          Execution Reference: {DOC_REF}-EXEC
        </Text>
      </LegalPage>
    </Document>
  );
}

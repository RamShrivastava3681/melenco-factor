type PaymentTerm = {
    range: string;
    description: string;
};
type FeeTier = {
    range: string;
    fee: string;
};
type ContactPerson = {
    firstName: string;
    lastName: string;
    company?: string;
    email: string;
    phone: string;
};
type BankAccount = {
    currency: string;
    accountHolder: string;
    accountNumber: string;
    swiftCode: string;
};
type PartyInfo = {
    name: string;
    address: string;
};
type AgreementData = {
    docRef?: string;
    envelopeId?: string;
    agreementDate?: string;
    place?: string;
    buyer?: PartyInfo;
    seller?: PartyInfo;
    sellerCorporateId?: string;
    sellerTaxId?: string;
    sellerContactPerson?: string;
    sellerEmail?: string;
    sellerPhone?: string;
    paymentTerms?: PaymentTerm[];
    transactionFeeTiers?: FeeTier[];
    factoringFee?: string;
    advanceRate?: string;
    setupFee?: string;
    lateFee?: string;
    referenceRate?: string;
    schedule1?: {
        primaryContacts?: ContactPerson[];
        bankAccounts?: BankAccount[];
        sellerSignatureName?: string;
        scheduleDate?: string;
        schedulePlace?: string;
    };
};
type FrameworkAgreementProps = {
    data: AgreementData;
};
export default function FrameworkAgreementDocument({ data }: FrameworkAgreementProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=frameworkAgreement.d.ts.map
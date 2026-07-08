// Client-safe metadata for the regulation documents.
// The full document texts live in lib/documents.ts and are imported ONLY
// by server code — importing them in a client component would ship ~380KB
// of regulation text to every visitor.

export interface DocumentMeta {
  name: string;
  description: string;
}

export const documentList: DocumentMeta[] = [
  {
    name: '606 CMR 7.00: Standards for Licensure of Child Care Programs',
    description: 'Massachusetts Department of Early Education and Care regulations covering Family Child Care, Small Group and School Age, and Large Group and School Age Child Care Programs',
  },
  {
    name: '606 CMR 10.00: Child Care Financial Assistance',
    description: 'Massachusetts regulations governing eligibility, provision, and termination of child care financial assistance programs including Income Eligible, DTA-related, DCF-related, and Young Parent programs',
  },
  {
    name: '606 CMR 14.00: Criminal Offender and Other Background Record Checks',
    description: 'Massachusetts regulations establishing standardized procedures for Background Record Checks (BRCs) of candidates for licensure, employment, or affiliation with EEC programs, including mandatory and presumptive disqualifications, review processes, and appeals',
  },
  {
    name: '102 CMR 1.00: Enforcement Standards and Definitions for Licensure or Approval',
    description: 'Massachusetts regulations establishing enforcement standards, compliance procedures, sanctions, fines, and appeal rights for programs licensed or approved by the Office of Child Care Services (now part of EEC)',
  },
];

export const sampleQuestions: string[] = [
        // 606 CMR 7.00 - Licensing Standards Questions
        "What are the staff-to-child ratios for school age programs?",
        "What qualifications does a School Age Program Administrator need?",
        "What are the requirements for outdoor play spaces?",
        "What health records must be maintained for children?",
        "What are the emergency preparedness requirements?",
        "What curriculum requirements are specified?",
        "What are the medication administration procedures?",
        "What parent communication requirements exist?",
        "What are the transportation safety requirements?",
        "What professional development is required for educators?",
        "What are the prohibited practices in child guidance?",
        "What are the nutrition requirements?",
        "What documentation is required at enrollment?",
        "What are the supervision requirements?",
        "What qualifications must a Group Leader have for school age programs?",
        "What are the requirements for children with disabilities?",
        "What notifications must be made to EEC?",
        "What are the physical facility safety requirements?",
        "What are the infection control procedures?",
        "What family involvement practices are required by 606 CMR 7.08?",

        // 606 CMR 10.00 - Financial Assistance Questions
        "What are the income eligibility requirements for child care financial assistance?",
        "What service needs qualify for child care financial assistance?",
        "How are parent fees calculated under the financial assistance program?",
        "What is the authorization period for income eligible child care financial assistance?",
        "What are the requirements for DTA-related child care?",
        "What is the eligibility criteria for DCF-related child care?",
        "Who qualifies for the Young Parent Child Care Services Program?",
        "What documentation is required for initial authorization?",
        "What changes must parents report during the authorization period?",
        "What are the reasons for termination of financial assistance?",
        "What is the review process for denial or termination of services?",
        "What are the sanctions for Intentional Program Violations?",
        "Can informal child care providers receive financial assistance payments?",
        "What is a provisional authorization under the financial assistance regulations?",
        "What are the requirements for reauthorization of child care financial assistance?",

        // 606 CMR 14.00 - Background Record Check Questions
        "What is the purpose of 606 CMR 14.00 Background Record Checks?",
        "Who must complete a Background Record Check?",
        "What are mandatory disqualifications?",
        "What is the difference between presumptive and discretionary disqualifications?",
        "What is provisional status and conditional hiring?",
        "How often must Background Record Checks be renewed?",
        "What are the candidate categories for family child care BRCs?",
        "What is the review process for candidates with disqualifications?",
        "What appeals are available for 'not suitable' determinations?",
        "What information must be submitted for a presumptive disqualification review?",
        "What are the requirements for CORI, SORI, and fingerprint checks?",
        "Can household members affect a family child care license?",
        "What is a final suitability determination?",
        "What are program responsibilities for Background Record Checks?",
        "What happens if a candidate provides false information during a BRC?",

        // 102 CMR 1.00 - Enforcement Standards and Compliance Questions
        "What is the purpose of 102 CMR 1.00 Enforcement Standards?",
        "What is a Deficiency Correction Order?",
        "What violations can result in sanctions or fines?",
        "What are the grounds for license suspension?",
        "What are the grounds for license revocation?",
        "What is the probation process for licensed programs?",
        "What appeal rights do licensees have?",
        "What is EEC's 'right to visit' authority?",
        "What notification requirements must programs follow?",
        "What constitutes disqualifying background information?",
        "What are the effective dates and severance provisions?",
        "What enforcement actions can EEC take for non-compliance?",
        "How are fines calculated for regulatory violations?",
        "What is the timeline for correcting deficiencies?",
        "Can programs continue operating during the appeals process?"
];

// Pick `count` distinct random questions (partial Fisher-Yates)
export function getRandomQuestions(count = 5): string[] {
  const pool = [...sampleQuestions];
  const n = Math.min(count, pool.length);
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(Math.random() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}

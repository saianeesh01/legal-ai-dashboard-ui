/**
 * Universal Legal Document Extractor
 * 
 * This module provides document-agnostic extraction of legal facts, dates, parties,
 * statistics, and legal references from various document types including:
 * - Court opinions and orders
 * - Complaints and dockets  
 * - Government forms (I-589, NTA, etc.)
 * - Council memos and RFPs
 * - Country and policy reports
 * - Other legal documents
 * 
 * Follows strict rules: document-only extraction, no hallucinations, verbatim snippets required
 */

// Core extraction interfaces
export interface ExtractedItem {
    value: string;
    page: number;
    evidence: string;
    confidence: number;
}

export interface ExtractedDate extends ExtractedItem {
    date_iso: string;
    label: 'filing' | 'hearing' | 'order' | 'decision' | 'announcement' | 'other';
}

export interface ExtractedStatute extends ExtractedItem {
    type: 'statute' | 'case' | 'regulation' | 'notice';
    citation: string;
}

export interface ExtractedStatistic extends ExtractedItem {
    metric: string;
    value: number;
    unit: 'percent' | 'count' | 'per_day' | 'per_month' | 'years' | 'other';
    context: string;
}

export interface ExtractedParty extends ExtractedItem {
    name: string;
    role?: 'plaintiff' | 'defendant' | 'petitioner' | 'respondent' | 'agency' | 'official';
}

export interface ExtractedField extends ExtractedItem {
    field: string;
}

export interface ExtractedRequirement extends ExtractedItem {
    item: string;
}

export interface ExtractedFunding extends ExtractedItem {
    amount: number | null;
    currency: 'USD' | null;
    context: string;
}

export interface ExtractedFinding extends ExtractedItem {
    statement: string;
}

export interface ExtractedTheme extends ExtractedItem {
    topic: string;
}

// Document type detection
export type DocumentType =
    | 'court_opinion_or_order'
    | 'complaint_or_docket'
    | 'government_form'
    | 'council_or_rfp'
    | 'grant_notice_or_rfa'
    | 'meeting_minutes'
    | 'procurement_sow_or_contract'
    | 'audit_or_investigation_report'
    | 'federal_report_to_congress'
    | 'country_or_policy_report'
    | 'academic_program_or_clinic_brochure'
    | 'proposal_or_whitepaper'
    | 'other_legal';

// Base metadata interface
export interface DocumentMetadata {
    title: string | null;
    jurisdiction_or_body: string | null;
    date_iso: string | null;
    page_count: number;
}

// Section schemas for each document type
export interface CourtOpinionSections {
    caption: {
        court: string;
        case_no: string | null;
        parties: {
            plaintiffs: ExtractedParty[];
            defendants: ExtractedParty[];
        };
    };
    holding_or_disposition: ExtractedItem[];
    key_dates: ExtractedDate[];
    statutes_cases_notices: ExtractedStatute[];
    statistics_or_figures: ExtractedStatistic[];
}

export interface ComplaintDocketSections {
    parties_and_roles: ExtractedParty[];
    claims_or_causes: ExtractedItem[];
    relief_requested: ExtractedItem[];
    key_dates: ExtractedDate[];
}

export interface GovernmentFormSections {
    form_id: string;
    agency: string;
    edition_or_omb: string | null;
    named_fields: ExtractedField[];
    warnings_or_instructions: ExtractedItem[];
}

export interface CouncilRFPSections {
    issuing_body: string;
    agenda_item_or_program: string | null;
    deadlines: ExtractedDate[];
    requirements: ExtractedRequirement[];
    funding_or_budget: ExtractedFunding[];
}

export interface CountryPolicyReportSections {
    scope_and_year: string;
    themes: ExtractedTheme[];
    findings: ExtractedFinding[];
    statistics: ExtractedStatistic[];
}

export interface OtherLegalSections {
    headings: { heading: string; page: number }[];
    extracted_items: ExtractedItem[];
}

// New section interfaces for additional document types
export interface GrantNoticeRFASections {
    program_name: string;
    funder: string;
    funding_ceiling: { amount: number | null; currency: 'USD' | null; page: number; evidence: string };
    award_count_or_range: { text: string; page: number; evidence: string };
    eligibility: ExtractedItem[];
    deadlines: ExtractedDate[];
    how_to_apply: ExtractedItem[];
    kpis_or_deliverables: ExtractedItem[];
}

export interface MeetingMinutesSections {
    body: string;
    meeting_datetime_iso: string | null;
    attendees: ExtractedParty[];
    motions: { motion: string; result: 'passed' | 'failed' | 'tabled' | 'other'; vote: string; page: number; evidence: string }[];
    agenda_items: { item: string; summary: string; page: number; evidence: string }[];
    actions_or_followups: { action: string; owner: string | null; page: number; evidence: string }[];
}

export interface ProcurementSOWContractSections {
    agency_or_buyer: string;
    period_of_performance: { start: string | null; end: string | null; page: number; evidence: string };
    place_of_performance: ExtractedItem[];
    scope: ExtractedItem[];
    qualifications: ExtractedItem[];
    compliance: ExtractedItem[];
}

export interface AuditInvestigationReportSections {
    issuing_body: string;
    scope_period: string | null;
    findings: ExtractedFinding[];
    metrics: ExtractedStatistic[];
    recommendations: ExtractedItem[];
}

export interface FederalReportToCongressSections {
    statutory_basis: ExtractedStatute[];
    proposed_targets_or_ceilings: { item: string; value: number; unit: 'count' | 'USD' | 'other'; page: number; evidence: string; confidence: number }[];
    program_components: ExtractedItem[];
    tables_or_annexes: ExtractedItem[];
}

export interface AcademicProgramClinicBrochureSections {
    institution: string;
    program_name: string;
    goals: ExtractedItem[];
    structure: ExtractedItem[];
    prerequisites: ExtractedItem[];
    units_or_hours: ExtractedItem[];
    contact: ExtractedItem[];
}

export interface ProposalWhitepaperSections {
    sponsor_or_author: string;
    objective: ExtractedItem[];
    need_or_justification: ExtractedItem[];
    budget_or_funding: ExtractedFunding[];
    deliverables_or_plan: ExtractedItem[];
}

// Main extraction result interface
export interface UniversalExtractionResult {
    doc_type: DocumentType;
    meta: DocumentMetadata;
    sections: CourtOpinionSections | ComplaintDocketSections | GovernmentFormSections | CouncilRFPSections | GrantNoticeRFASections | MeetingMinutesSections | ProcurementSOWContractSections | AuditInvestigationReportSections | FederalReportToCongressSections | CountryPolicyReportSections | AcademicProgramClinicBrochureSections | ProposalWhitepaperSections | OtherLegalSections;
}

/**
 * Universal Legal Document Extractor Class
 * 
 * Implements the comprehensive extraction logic following strict document-only rules
 */
export class UniversalLegalExtractor {

    /**
     * Main extraction method that processes document text and returns structured data
     */
    static async extractFromText(
        documentText: string,
        fileName: string,
        pageCount: number = 1
    ): Promise<UniversalExtractionResult> {

        console.log(`🔍 Starting universal legal document extraction for: ${fileName}`);

        // Step 1: Detect document type from content
        const docType = this.detectDocumentType(documentText);
        console.log(`📋 Detected document type: ${docType}`);

        // Step 2: Extract metadata
        const metadata = this.extractMetadata(documentText, fileName, pageCount);

        // Step 3: Extract sections based on document type
        const sections = await this.extractSections(documentText, docType);

        const result: UniversalExtractionResult = {
            doc_type: docType,
            meta: metadata,
            sections: sections
        };

        console.log(`✅ Universal extraction completed for ${fileName}`);
        return result;
    }

    /**
     * Detect document type from content analysis (first 2-3 pages, headings, caption blocks)
     */
    private static detectDocumentType(documentText: string): DocumentType {
        const firstPages = documentText.substring(0, Math.min(3000, documentText.length));
        const lowerText = firstPages.toLowerCase();

        // Court opinion/order indicators
        if (
            lowerText.includes('memorandum opinion') ||
            lowerText.includes('order') ||
            lowerText.includes('judge') ||
            lowerText.includes('court') ||
            lowerText.includes('case no') ||
            lowerText.includes('plaintiff') ||
            lowerText.includes('defendant') ||
            lowerText.includes('v.') ||
            lowerText.includes('united states district court') ||
            lowerText.includes('circuit court')
        ) {
            return 'court_opinion_or_order';
        }

        // Complaint/docket indicators
        if (
            lowerText.includes('complaint') ||
            lowerText.includes('petition') ||
            lowerText.includes('docket') ||
            lowerText.includes('civil action') ||
            lowerText.includes('case number')
        ) {
            return 'complaint_or_docket';
        }

        // Government form indicators
        if (
            lowerText.includes('form i-') ||
            lowerText.includes('form i-589') ||
            lowerText.includes('form i-862') ||
            lowerText.includes('notice to appear') ||
            lowerText.includes('omb no') ||
            lowerText.includes('edition') ||
            lowerText.includes('uscis') ||
            lowerText.includes('eoir')
        ) {
            return 'government_form';
        }

        // Council/RFP indicators
        if (
            lowerText.includes('council') ||
            lowerText.includes('agenda') ||
            lowerText.includes('rfp') ||
            lowerText.includes('request for proposal') ||
            lowerText.includes('staff report') ||
            lowerText.includes('public notice') ||
            lowerText.includes('meeting')
        ) {
            return 'council_or_rfp';
        }

        // Country/policy report indicators
        if (
            lowerText.includes('human rights') ||
            lowerText.includes('country report') ||
            lowerText.includes('annual report') ||
            lowerText.includes('policy') ||
            lowerText.includes('white paper') ||
            lowerText.includes('investigation')
        ) {
            return 'country_or_policy_report';
        }

        // Grant notice/RFA indicators
        if (
            lowerText.includes('grant') ||
            lowerText.includes('rfa') ||
            lowerText.includes('nofo') ||
            lowerText.includes('funding opportunity') ||
            lowerText.includes('request for application') ||
            lowerText.includes('federal funding') ||
            lowerText.includes('award') ||
            lowerText.includes('eligibility')
        ) {
            return 'grant_notice_or_rfa';
        }

        // Meeting minutes indicators
        if (
            lowerText.includes('minutes') ||
            lowerText.includes('meeting') ||
            lowerText.includes('board') ||
            lowerText.includes('commission') ||
            lowerText.includes('trustee') ||
            lowerText.includes('motion') ||
            lowerText.includes('agenda') ||
            lowerText.includes('attendance')
        ) {
            return 'meeting_minutes';
        }

        // Procurement/SOW/Contract indicators
        if (
            lowerText.includes('statement of work') ||
            lowerText.includes('sow') ||
            lowerText.includes('contract') ||
            lowerText.includes('procurement') ||
            lowerText.includes('period of performance') ||
            lowerText.includes('scope of work') ||
            lowerText.includes('qualifications') ||
            lowerText.includes('compliance')
        ) {
            return 'procurement_sow_or_contract';
        }

        // Audit/Investigation report indicators
        if (
            lowerText.includes('audit') ||
            lowerText.includes('investigation') ||
            lowerText.includes('inspector general') ||
            lowerText.includes('comptroller') ||
            lowerText.includes('findings') ||
            lowerText.includes('recommendations') ||
            lowerText.includes('scope period')
        ) {
            return 'audit_or_investigation_report';
        }

        // Federal report to Congress indicators
        if (
            lowerText.includes('congress') ||
            lowerText.includes('statutory') ||
            lowerText.includes('federal report') ||
            lowerText.includes('presidential determination') ||
            lowerText.includes('resettlement') ||
            lowerText.includes('refugee') ||
            lowerText.includes('asylum')
        ) {
            return 'federal_report_to_congress';
        }

        // Academic program/Clinic brochure indicators
        if (
            lowerText.includes('clinic') ||
            lowerText.includes('program') ||
            lowerText.includes('academic') ||
            lowerText.includes('prerequisite') ||
            lowerText.includes('units') ||
            lowerText.includes('credit') ||
            lowerText.includes('enrollment') ||
            lowerText.includes('curriculum')
        ) {
            return 'academic_program_or_clinic_brochure';
        }

        // Proposal/Whitepaper indicators
        if (
            lowerText.includes('proposal') ||
            lowerText.includes('whitepaper') ||
            lowerText.includes('white paper') ||
            lowerText.includes('sponsor') ||
            lowerText.includes('objective') ||
            lowerText.includes('deliverables') ||
            lowerText.includes('budget')
        ) {
            return 'proposal_or_whitepaper';
        }

        return 'other_legal';
    }

    /**
     * Extract basic metadata from document
     */
    private static extractMetadata(documentText: string, fileName: string, pageCount: number): DocumentMetadata {
        const metadata: DocumentMetadata = {
            title: this.extractTitle(documentText, fileName),
            jurisdiction_or_body: this.extractJurisdiction(documentText),
            date_iso: this.extractMainDate(documentText),
            page_count: pageCount
        };

        return metadata;
    }

    /**
     * Extract document title or use filename as fallback
     */
    private static extractTitle(documentText: string, fileName: string): string | null {
        // Look for title patterns in first few lines
        const lines = documentText.split('\n').slice(0, 10);

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.length > 10 && trimmed.length < 200) {
                // Check if it looks like a title (capitalized, not all caps, not a date)
                if (
                    /^[A-Z][a-z]/.test(trimmed) &&
                    !/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(trimmed) &&
                    !/^[A-Z\s]+$/.test(trimmed) // Not all caps
                ) {
                    return trimmed;
                }
            }
        }

        // Fallback to filename without extension
        return fileName.replace(/\.[^/.]+$/, '');
    }

    /**
     * Extract jurisdiction or issuing body
     */
    private static extractJurisdiction(documentText: string): string | null {
        const lowerText = documentText.toLowerCase();

        // Court jurisdictions
        if (lowerText.includes('united states district court')) return 'United States District Court';
        if (lowerText.includes('circuit court')) return 'Circuit Court';
        if (lowerText.includes('supreme court')) return 'Supreme Court';

        // Government agencies
        if (lowerText.includes('uscis')) return 'USCIS';
        if (lowerText.includes('eoir')) return 'EOIR';
        if (lowerText.includes('department of justice')) return 'Department of Justice';

        // Local bodies
        if (lowerText.includes('city council')) return 'City Council';
        if (lowerText.includes('board of supervisors')) return 'Board of Supervisors';

        return null;
    }

    /**
     * Extract main document date
     */
    private static extractMainDate(documentText: string): string | null {
        const datePatterns = [
            /(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/gi,
            /\b\d{4}-\d{2}-\d{2}\b/g,
            /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g
        ];

        for (const pattern of datePatterns) {
            const matches = documentText.match(pattern);
            if (matches && matches.length > 0) {
                // Convert to ISO format
                const date = new Date(matches[0]);
                if (!isNaN(date.getTime())) {
                    return date.toISOString().split('T')[0];
                }
            }
        }

        return null;
    }

    /**
     * Extract sections based on document type
     */
    private static async extractSections(documentText: string, docType: DocumentType): Promise<any> {
        switch (docType) {
            case 'court_opinion_or_order':
                return this.extractCourtOpinionSections(documentText);
            case 'complaint_or_docket':
                return this.extractComplaintDocketSections(documentText);
            case 'government_form':
                return this.extractGovernmentFormSections(documentText);
            case 'council_or_rfp':
                return this.extractCouncilRFPSections(documentText);
            case 'grant_notice_or_rfa':
                return this.extractGrantNoticeRFASections(documentText);
            case 'meeting_minutes':
                return this.extractMeetingMinutesSections(documentText);
            case 'procurement_sow_or_contract':
                return this.extractProcurementSOWContractSections(documentText);
            case 'audit_or_investigation_report':
                return this.extractAuditInvestigationReportSections(documentText);
            case 'federal_report_to_congress':
                return this.extractFederalReportToCongressSections(documentText);
            case 'country_or_policy_report':
                return this.extractCountryPolicyReportSections(documentText);
            case 'academic_program_or_clinic_brochure':
                return this.extractAcademicProgramClinicBrochureSections(documentText);
            case 'proposal_or_whitepaper':
                return this.extractProposalWhitepaperSections(documentText);
            case 'other_legal':
                return this.extractOtherLegalSections(documentText);
            default:
                return this.extractOtherLegalSections(documentText);
        }
    }

    /**
     * Extract sections for court opinions and orders
     */
    private static extractCourtOpinionSections(documentText: string): CourtOpinionSections {
        const sections: CourtOpinionSections = {
            caption: {
                court: this.extractCourtName(documentText) || 'Not specified in document',
                case_no: this.extractCaseNumber(documentText),
                parties: {
                    plaintiffs: this.extractParties(documentText, 'plaintiff'),
                    defendants: this.extractParties(documentText, 'defendant')
                }
            },
            holding_or_disposition: this.extractHoldings(documentText),
            key_dates: this.extractKeyDates(documentText),
            statutes_cases_notices: this.extractStatutesCasesNotices(documentText),
            statistics_or_figures: this.extractStatistics(documentText)
        };

        return sections;
    }

    /**
     * Extract sections for complaints and dockets
     */
    private static extractComplaintDocketSections(documentText: string): ComplaintDocketSections {
        const sections: ComplaintDocketSections = {
            parties_and_roles: this.extractAllPartiesWithRoles(documentText),
            claims_or_causes: this.extractClaims(documentText),
            relief_requested: this.extractReliefRequested(documentText),
            key_dates: this.extractKeyDates(documentText)
        };

        return sections;
    }

    /**
     * Extract sections for government forms
     */
    private static extractGovernmentFormSections(documentText: string): GovernmentFormSections {
        const sections: GovernmentFormSections = {
            form_id: this.extractFormId(documentText) || 'Not specified in document',
            agency: this.extractAgency(documentText) || 'Not specified in document',
            edition_or_omb: this.extractEditionOrOMB(documentText),
            named_fields: this.extractNamedFields(documentText),
            warnings_or_instructions: this.extractWarningsInstructions(documentText)
        };

        return sections;
    }

    /**
     * Extract sections for council memos and RFPs
     */
    private static extractCouncilRFPSections(documentText: string): CouncilRFPSections {
        const sections: CouncilRFPSections = {
            issuing_body: this.extractIssuingBody(documentText) || 'Not specified in document',
            agenda_item_or_program: this.extractAgendaItem(documentText),
            deadlines: this.extractKeyDates(documentText),
            requirements: this.extractRequirements(documentText),
            funding_or_budget: this.extractFundingBudget(documentText)
        };

        return sections;
    }

    /**
     * Extract sections for country and policy reports
     */
    private static extractCountryPolicyReportSections(documentText: string): CountryPolicyReportSections {
        const sections: CountryPolicyReportSections = {
            scope_and_year: this.extractScopeAndYear(documentText) || 'Not specified in document',
            themes: this.extractThemes(documentText),
            findings: this.extractFindings(documentText),
            statistics: this.extractStatistics(documentText)
        };

        return sections;
    }

    /**
     * Extract sections for other legal documents
     */
    private static extractOtherLegalSections(documentText: string): OtherLegalSections {
        const sections: OtherLegalSections = {
            headings: this.extractHeadings(documentText),
            extracted_items: this.extractGenericItems(documentText)
        };

        return sections;
    }

    // Helper extraction methods for specific data types

    private static extractCourtName(documentText: string): string | null {
        const courtPatterns = [
            /united states district court for the (.+?) district/gi,
            /united states court of appeals for the (.+?) circuit/gi,
            /supreme court of the united states/gi
        ];

        for (const pattern of courtPatterns) {
            const match = documentText.match(pattern);
            if (match) return match[0];
        }

        return null;
    }

    private static extractCaseNumber(documentText: string): string | null {
        const casePattern = /case no\.?\s*:?\s*([A-Z0-9\-_]+)/i;
        const match = documentText.match(casePattern);
        return match ? match[1] : null;
    }

    private static extractParties(documentText: string, partyType: 'plaintiff' | 'defendant'): ExtractedParty[] {
        const parties: ExtractedParty[] = [];
        const partyPattern = new RegExp(`${partyType}s?\\s*:?\\s*([^\\n]+)`, 'gi');

        let match;
        while ((match = partyPattern.exec(documentText)) !== null) {
            const name = match[1].trim();
            if (name.length > 0) {
                parties.push({
                    name,
                    page: 1, // Default page
                    evidence: `${partyType}s: ${name}`,
                    confidence: 0.8
                });
            }
        }

        return parties;
    }

    private static extractAllPartiesWithRoles(documentText: string): ExtractedParty[] {
        const parties: ExtractedParty[] = [];

        // Extract plaintiffs
        const plaintiffMatches = documentText.match(/plaintiffs?[:\s]+([^\n]+)/gi);
        if (plaintiffMatches) {
            plaintiffMatches.forEach(match => {
                const name = match.replace(/plaintiffs?[:\s]+/i, '').trim();
                if (name.length > 0) {
                    parties.push({
                        name,
                        role: 'plaintiff',
                        page: 1,
                        evidence: match,
                        confidence: 0.8
                    });
                }
            });
        }

        // Extract defendants
        const defendantMatches = documentText.match(/defendants?[:\s]+([^\n]+)/gi);
        if (defendantMatches) {
            defendantMatches.forEach(match => {
                const name = match.replace(/defendants?[:\s]+/i, '').trim();
                if (name.length > 0) {
                    parties.push({
                        name,
                        role: 'defendant',
                        page: 1,
                        evidence: match,
                        confidence: 0.8
                    });
                }
            });
        }

        return parties;
    }

    private static extractHoldings(documentText: string): ExtractedItem[] {
        const holdings: ExtractedItem[] = [];

        // Look for holding patterns
        const holdingPatterns = [
            /(?:holding|conclusion|decision|disposition)[:\s]+([^.\n]+)/gi,
            /(?:the court|this court|we)\s+(?:holds?|concludes?|finds?|determines?)\s+([^.\n]+)/gi
        ];

        for (const pattern of holdingPatterns) {
            let match;
            while ((match = pattern.exec(documentText)) !== null) {
                const statement = match[1].trim();
                if (statement.length > 10) {
                    holdings.push({
                        value: statement,
                        page: 1,
                        evidence: match[0],
                        confidence: 0.8
                    });
                }
            }
        }

        return holdings;
    }

    private static extractKeyDates(documentText: string): ExtractedDate[] {
        const dates: ExtractedDate[] = [];

        // Date patterns
        const datePatterns = [
            /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/gi,
            /\b\d{4}-\d{2}-\d{2}\b/g,
            /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g
        ];

        for (const pattern of datePatterns) {
            let match;
            while ((match = pattern.exec(documentText)) !== null) {
                const dateStr = match[0];
                const date = new Date(dateStr);

                if (!isNaN(date.getTime())) {
                    const isoDate = date.toISOString().split('T')[0];
                    const label = this.determineDateLabel(dateStr, documentText);

                    dates.push({
                        date_iso: isoDate,
                        label,
                        page: 1,
                        evidence: dateStr,
                        confidence: 0.9
                    });
                }
            }
        }

        // Remove duplicates
        return this.deduplicateDates(dates);
    }

    private static determineDateLabel(dateStr: string, documentText: string): ExtractedDate['label'] {
        const context = documentText.substring(
            Math.max(0, documentText.indexOf(dateStr) - 100),
            documentText.indexOf(dateStr) + 100
        ).toLowerCase();

        if (context.includes('filed') || context.includes('filing')) return 'filing';
        if (context.includes('hearing') || context.includes('oral argument')) return 'hearing';
        if (context.includes('order') || context.includes('entered')) return 'order';
        if (context.includes('decision') || context.includes('ruling')) return 'decision';
        if (context.includes('announcement') || context.includes('published')) return 'announcement';

        return 'other';
    }

    private static deduplicateDates(dates: ExtractedDate[]): ExtractedDate[] {
        const seen = new Set<string>();
        return dates.filter(date => {
            const key = `${date.date_iso}-${date.label}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    private static extractStatutesCasesNotices(documentText: string): ExtractedStatute[] {
        const statutes: ExtractedStatute[] = [];

        // Statute patterns
        const statutePatterns = [
            /\b\d+\s+U\.?S\.?C\.?\s*§\s*[\d\w\(\)\.]+\b/gi,
            /\b\d+\s+Fed\.?\s*Reg\.?\s+\d+\b/gi,
            /case law|precedent|jurisprudence/gi
        ];

        for (const pattern of statutePatterns) {
            let match;
            while ((match = pattern.exec(documentText)) !== null) {
                const citation = match[0];
                const type = this.determineStatuteType(citation);

                statutes.push({
                    type,
                    citation,
                    page: 1,
                    evidence: citation,
                    confidence: 0.9
                });
            }
        }

        return statutes;
    }

    private static determineStatuteType(citation: string): ExtractedStatute['type'] {
        if (citation.includes('U.S.C.') || citation.includes('USC')) return 'statute';
        if (citation.includes('Fed. Reg.') || citation.includes('Fed Reg')) return 'regulation';
        if (citation.includes('case law') || citation.includes('precedent')) return 'case';
        return 'notice';
    }

    private static extractStatistics(documentText: string): ExtractedStatistic[] {
        const statistics: ExtractedStatistic[] = [];

        // Number patterns with units
        const statPatterns = [
            /(\d{1,3}(,\d{3})+|\d+)(\.\d+)?\s*(%|percent|per\s+day|per\s+month|applications?|encounters?|years?)/gi,
            /(\d+)\s+(million|thousand|hundred)/gi
        ];

        for (const pattern of statPatterns) {
            let match;
            while ((match = pattern.exec(documentText)) !== null) {
                const value = parseInt(match[1].replace(/,/g, ''));
                const unit = this.determineUnit(match[0]);
                const metric = this.extractMetric(match[0]);
                const context = this.extractContext(match[0], documentText);

                if (!isNaN(value)) {
                    statistics.push({
                        metric,
                        value,
                        unit,
                        context,
                        page: 1,
                        evidence: match[0],
                        confidence: 0.8
                    });
                }
            }
        }

        return statistics;
    }

    private static determineUnit(statString: string): ExtractedStatistic['unit'] {
        const lower = statString.toLowerCase();
        if (lower.includes('%') || lower.includes('percent')) return 'percent';
        if (lower.includes('per day')) return 'per_day';
        if (lower.includes('per month')) return 'per_month';
        if (lower.includes('years')) return 'years';
        return 'count';
    }

    private static extractMetric(statString: string): string {
        // Extract meaningful metric name from context
        return 'value'; // Simplified for now
    }

    private static extractContext(statString: string, documentText: string): string {
        const context = documentText.substring(
            Math.max(0, documentText.indexOf(statString) - 50),
            documentText.indexOf(statString) + 50
        );
        return context.trim();
    }

    // Additional helper methods for other document types

    private static extractClaims(documentText: string): ExtractedItem[] {
        const claims: ExtractedItem[] = [];
        const claimPattern = /(?:claim|cause of action)[:\s]+([^.\n]+)/gi;

        let match;
        while ((match = claimPattern.exec(documentText)) !== null) {
            const description = match[1].trim();
            if (description.length > 0) {
                claims.push({
                    value: description,
                    page: 1,
                    evidence: match[0],
                    confidence: 0.8
                });
            }
        }

        return claims;
    }

    private static extractReliefRequested(documentText: string): ExtractedItem[] {
        const relief: ExtractedItem[] = [];
        const reliefPattern = /(?:relief|prayer|requested)[:\s]+([^.\n]+)/gi;

        let match;
        while ((match = reliefPattern.exec(documentText)) !== null) {
            const item = match[1].trim();
            if (item.length > 0) {
                relief.push({
                    value: item,
                    page: 1,
                    evidence: match[0],
                    confidence: 0.8
                });
            }
        }

        return relief;
    }

    private static extractFormId(documentText: string): string | null {
        const formPattern = /form\s+(i-\d+)/i;
        const match = documentText.match(formPattern);
        return match ? match[1].toUpperCase() : null;
    }

    private static extractAgency(documentText: string): string | null {
        const agencyPatterns = [
            /uscis|united states citizenship and immigration services/gi,
            /eoir|executive office for immigration review/gi,
            /department of justice/gi
        ];

        for (const pattern of agencyPatterns) {
            const match = documentText.match(pattern);
            if (match) return match[0];
        }

        return null;
    }

    private static extractEditionOrOMB(documentText: string): string | null {
        const ombPattern = /omb\s+no\.?\s*:?\s*(\d+-\d+)/i;
        const editionPattern = /edition\s*:?\s*(\d{2}\/\d{2}\/\d{2,4})/i;

        const ombMatch = documentText.match(ombPattern);
        const editionMatch = documentText.match(editionPattern);

        if (ombMatch && editionMatch) {
            return `OMB ${ombMatch[1]} / Edition ${editionMatch[1]}`;
        } else if (ombMatch) {
            return `OMB ${ombMatch[1]}`;
        } else if (editionMatch) {
            return `Edition ${editionMatch[1]}`;
        }

        return null;
    }

    private static extractNamedFields(documentText: string): ExtractedField[] {
        const fields: ExtractedField[] = [];
        // This would need more sophisticated field extraction logic
        return fields;
    }

    private static extractWarningsInstructions(documentText: string): ExtractedItem[] {
        const warnings: ExtractedItem[] = [];
        const warningPattern = /(?:warning|caution|important|note)[:\s]+([^.\n]+)/gi;

        let match;
        while ((match = warningPattern.exec(documentText)) !== null) {
            const text = match[1].trim();
            if (text.length > 0) {
                warnings.push({
                    value: text,
                    page: 1,
                    evidence: match[0],
                    confidence: 0.8
                });
            }
        }

        return warnings;
    }

    private static extractIssuingBody(documentText: string): string | null {
        const bodyPatterns = [
            /city council/gi,
            /board of supervisors/gi,
            /planning commission/gi
        ];

        for (const pattern of bodyPatterns) {
            const match = documentText.match(pattern);
            if (match) return match[0];
        }

        return null;
    }

    private static extractAgendaItem(documentText: string): string | null {
        const agendaPattern = /agenda\s+item[:\s]+([^.\n]+)/i;
        const match = documentText.match(agendaPattern);
        return match ? match[1].trim() : null;
    }

    private static extractRequirements(documentText: string): ExtractedRequirement[] {
        const requirements: ExtractedRequirement[] = [];
        const reqPattern = /(?:requirement|criteria|qualification)[:\s]+([^.\n]+)/gi;

        let match;
        while ((match = reqPattern.exec(documentText)) !== null) {
            const item = match[1].trim();
            if (item.length > 0) {
                requirements.push({
                    item,
                    page: 1,
                    evidence: match[0],
                    confidence: 0.8
                });
            }
        }

        return requirements;
    }

    private static extractFundingBudget(documentText: string): ExtractedFunding[] {
        const funding: ExtractedFunding[] = [];
        const fundingPattern = /\$?(\d{1,3}(,\d{3})+|\d+)(\.\d+)?\s*(million|thousand|hundred)?/gi;

        let match;
        while ((match = fundingPattern.exec(documentText)) !== null) {
            const amount = parseFloat(match[1].replace(/,/g, ''));
            const context = this.extractContext(match[0], documentText);

            if (!isNaN(amount)) {
                funding.push({
                    amount,
                    currency: 'USD',
                    context,
                    page: 1,
                    evidence: match[0],
                    confidence: 0.8
                });
            }
        }

        return funding;
    }

    private static extractScopeAndYear(documentText: string): string | null {
        const scopePattern = /(?:report|investigation)\s+(?:for|of|on)\s+([^.\n]+)/i;
        const yearPattern = /(?:year|fiscal year)\s+(\d{4})/i;

        const scopeMatch = documentText.match(scopePattern);
        const yearMatch = documentText.match(yearPattern);

        if (scopeMatch && yearMatch) {
            return `${scopeMatch[1].trim()} - ${yearMatch[1]}`;
        } else if (scopeMatch) {
            return scopeMatch[1].trim();
        } else if (yearMatch) {
            return `Year ${yearMatch[1]}`;
        }

        return null;
    }

    private static extractThemes(documentText: string): ExtractedTheme[] {
        const themes: ExtractedTheme[] = [];
        const themePattern = /(?:theme|topic|issue|area)[:\s]+([^.\n]+)/gi;

        let match;
        while ((match = themePattern.exec(documentText)) !== null) {
            const topic = match[1].trim();
            if (topic.length > 0) {
                themes.push({
                    topic,
                    page: 1,
                    evidence: match[0],
                    confidence: 0.8
                });
            }
        }

        return themes;
    }

    private static extractFindings(documentText: string): ExtractedFinding[] {
        const findings: ExtractedFinding[] = [];
        const findingPattern = /(?:finding|conclusion|result)[:\s]+([^.\n]+)/gi;

        let match;
        while ((match = findingPattern.exec(documentText)) !== null) {
            const statement = match[1].trim();
            if (statement.length > 0) {
                findings.push({
                    statement,
                    page: 1,
                    evidence: match[0],
                    confidence: 0.8
                });
            }
        }

        return findings;
    }

    private static extractHeadings(documentText: string): { heading: string; page: number }[] {
        const headings: { heading: string; page: number }[] = [];
        const lines = documentText.split('\n');

        for (let i = 0; i < Math.min(lines.length, 50); i++) {
            const line = lines[i].trim();
            if (line.length > 5 && line.length < 100 && /^[A-Z][A-Z\s]+$/.test(line)) {
                headings.push({
                    heading: line,
                    page: 1
                });
            }
        }

        return headings;
    }

    private static extractGenericItems(documentText: string): ExtractedItem[] {
        const items: ExtractedItem[] = [];

        // Extract any remaining structured information
        const genericPatterns = [
            /(?:deadline|due date)[:\s]+([^.\n]+)/gi,
            /(?:contact|phone|email)[:\s]+([^.\n]+)/gi
        ];

        for (const pattern of genericPatterns) {
            let match;
            while ((match = pattern.exec(documentText)) !== null) {
                const value = match[1].trim();
                if (value.length > 0) {
                    items.push({
                        value,
                        page: 1,
                        evidence: match[0],
                        confidence: 0.7
                    });
                }
            }
        }

        return items;
    }

    // New extraction methods for additional document types

    private static extractGrantNoticeRFASections(documentText: string): GrantNoticeRFASections {
        const sections: GrantNoticeRFASections = {
            program_name: this.extractProgramName(documentText) || 'Not specified in document',
            funder: this.extractFunder(documentText) || 'Not specified in document',
            funding_ceiling: this.extractFundingCeiling(documentText),
            award_count_or_range: this.extractAwardCountRange(documentText),
            eligibility: this.extractEligibility(documentText),
            deadlines: this.extractKeyDates(documentText),
            how_to_apply: this.extractHowToApply(documentText),
            kpis_or_deliverables: this.extractKPIsDeliverables(documentText)
        };
        return sections;
    }

    private static extractMeetingMinutesSections(documentText: string): MeetingMinutesSections {
        const sections: MeetingMinutesSections = {
            body: this.extractMeetingBody(documentText) || 'Not specified in document',
            meeting_datetime_iso: this.extractMeetingDateTime(documentText),
            attendees: this.extractMeetingAttendees(documentText),
            motions: this.extractMotions(documentText),
            agenda_items: this.extractAgendaItems(documentText),
            actions_or_followups: this.extractActionsFollowups(documentText)
        };
        return sections;
    }

    private static extractProcurementSOWContractSections(documentText: string): ProcurementSOWContractSections {
        const sections: ProcurementSOWContractSections = {
            agency_or_buyer: this.extractAgencyBuyer(documentText) || 'Not specified in document',
            period_of_performance: this.extractPeriodOfPerformance(documentText),
            place_of_performance: this.extractPlaceOfPerformance(documentText),
            scope: this.extractScope(documentText),
            qualifications: this.extractQualifications(documentText),
            compliance: this.extractCompliance(documentText)
        };
        return sections;
    }

    private static extractAuditInvestigationReportSections(documentText: string): AuditInvestigationReportSections {
        const sections: AuditInvestigationReportSections = {
            issuing_body: this.extractIssuingBody(documentText) || 'Not specified in document',
            scope_period: this.extractScopePeriod(documentText),
            findings: this.extractFindings(documentText),
            metrics: this.extractStatistics(documentText),
            recommendations: this.extractRecommendations(documentText)
        };
        return sections;
    }

    private static extractFederalReportToCongressSections(documentText: string): FederalReportToCongressSections {
        const sections: FederalReportToCongressSections = {
            statutory_basis: this.extractStatutesCasesNotices(documentText),
            proposed_targets_or_ceilings: this.extractProposedTargetsCeilings(documentText),
            program_components: this.extractProgramComponents(documentText),
            tables_or_annexes: this.extractTablesAnnexes(documentText)
        };
        return sections;
    }

    private static extractAcademicProgramClinicBrochureSections(documentText: string): AcademicProgramClinicBrochureSections {
        const sections: AcademicProgramClinicBrochureSections = {
            institution: this.extractInstitution(documentText) || 'Not specified in document',
            program_name: this.extractProgramName(documentText) || 'Not specified in document',
            goals: this.extractGoals(documentText),
            structure: this.extractStructure(documentText),
            prerequisites: this.extractPrerequisites(documentText),
            units_or_hours: this.extractUnitsHours(documentText),
            contact: this.extractContact(documentText)
        };
        return sections;
    }

    private static extractProposalWhitepaperSections(documentText: string): ProposalWhitepaperSections {
        const sections: ProposalWhitepaperSections = {
            sponsor_or_author: this.extractSponsorAuthor(documentText) || 'Not specified in document',
            objective: this.extractObjective(documentText),
            need_or_justification: this.extractNeedJustification(documentText),
            budget_or_funding: this.extractFundingBudget(documentText),
            deliverables_or_plan: this.extractDeliverablesPlan(documentText)
        };
        return sections;
    }

    // Helper methods for new document types
    private static extractProgramName(documentText: string): string | null {
        const patterns = [
            /(?:program|clinic|initiative)[:\s]+([^.\n]+)/gi,
            /(?:title|name)[:\s]+([^.\n]+)/gi
        ];

        for (const pattern of patterns) {
            const match = documentText.match(pattern);
            if (match && match[1]) {
                return match[1].trim();
            }
        }
        return null;
    }

    private static extractFunder(documentText: string): string | null {
        const patterns = [
            /(?:funder|sponsor|agency)[:\s]+([^.\n]+)/gi,
            /(?:department of|ministry of|office of)[^.\n]+/gi
        ];

        for (const pattern of patterns) {
            const match = documentText.match(pattern);
            if (match && match[1]) {
                return match[1].trim();
            }
        }
        return null;
    }

    private static extractFundingCeiling(documentText: string): { amount: number | null; currency: 'USD' | null; page: number; evidence: string } {
        const amountPattern = /(?:funding ceiling|maximum award|budget limit)[:\s]*\$?([\d,]+(?:\.\d{2})?)/gi;
        const match = documentText.match(amountPattern);

        if (match && match[1]) {
            const amount = parseFloat(match[1].replace(/,/g, ''));
            return {
                amount: isNaN(amount) ? null : amount,
                currency: 'USD',
                page: 1,
                evidence: match[0]
            };
        }

        return { amount: null, currency: null, page: 1, evidence: 'Not specified in document' };
    }

    private static extractAwardCountRange(documentText: string): { text: string; page: number; evidence: string } {
        const patterns = [
            /(?:award count|number of awards)[:\s]+([^.\n]+)/gi,
            /(?:up to|approximately|between)[^.\n]+awards?/gi
        ];

        for (const pattern of patterns) {
            const match = documentText.match(pattern);
            if (match && match[1]) {
                return { text: match[1].trim(), page: 1, evidence: match[0] };
            }
        }

        return { text: 'Not specified in document', page: 1, evidence: 'Not specified in document' };
    }

    private static extractEligibility(documentText: string): ExtractedItem[] {
        const items: ExtractedItem[] = [];
        const patterns = [
            /(?:eligibility|qualification)[:\s]+([^.\n]+)/gi,
            /(?:must be|required to|eligible if)[^.\n]+/gi
        ];

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(documentText)) !== null) {
                const value = match[1] || match[0];
                if (value.length > 0) {
                    items.push({
                        value: value.trim(),
                        page: 1,
                        evidence: match[0],
                        confidence: 0.8
                    });
                }
            }
        }

        return items;
    }

    private static extractHowToApply(documentText: string): ExtractedItem[] {
        const items: ExtractedItem[] = [];
        const patterns = [
            /(?:how to apply|application process|submission)[:\s]+([^.\n]+)/gi,
            /(?:step \d+)[:\s]+([^.\n]+)/gi
        ];

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(documentText)) !== null) {
                const value = match[1] || match[0];
                if (value.length > 0) {
                    items.push({
                        value: value.trim(),
                        page: 1,
                        evidence: match[0],
                        confidence: 0.8
                    });
                }
            }
        }

        return items;
    }

    private static extractKPIsDeliverables(documentText: string): ExtractedItem[] {
        const items: ExtractedItem[] = [];
        const patterns = [
            /(?:deliverable|kpi|outcome|result)[:\s]+([^.\n]+)/gi,
            /(?:expected to|will provide|must deliver)[^.\n]+/gi
        ];

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(documentText)) !== null) {
                const value = match[1] || match[0];
                if (value.length > 0) {
                    items.push({
                        value: value.trim(),
                        page: 1,
                        evidence: match[0],
                        confidence: 0.8
                    });
                }
            }
        }

        return items;
    }

    private static extractMeetingBody(documentText: string): string | null {
        const patterns = [
            /(?:meeting of|board of|commission of)[^.\n]+/gi,
            /(?:trustees|members|council)[^.\n]+/gi
        ];

        for (const pattern of patterns) {
            const match = documentText.match(pattern);
            if (match) {
                return match[0].trim();
            }
        }
        return null;
    }

    private static extractMeetingDateTime(documentText: string): string | null {
        const patterns = [
            /(?:meeting date|date of meeting)[:\s]+([^.\n]+)/gi,
            /(?:held on|conducted on)[^.\n]+/gi
        ];

        for (const pattern of patterns) {
            const match = documentText.match(pattern);
            if (match && match[1]) {
                const date = new Date(match[1]);
                if (!isNaN(date.getTime())) {
                    return date.toISOString();
                }
            }
        }
        return null;
    }

    private static extractMeetingAttendees(documentText: string): ExtractedParty[] {
        const attendees: ExtractedParty[] = [];
        const patterns = [
            /(?:present|attending|members present)[:\s]+([^.\n]+)/gi,
            /(?:trustee|member|staff)[:\s]+([^.\n]+)/gi
        ];

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(documentText)) !== null) {
                const names = match[1].split(',').map(n => n.trim());
                for (const name of names) {
                    if (name.length > 0) {
                        attendees.push({
                            name,
                            page: 1,
                            evidence: match[0],
                            confidence: 0.8
                        });
                    }
                }
            }
        }

        return attendees;
    }

    private static extractMotions(documentText: string): { motion: string; result: 'passed' | 'failed' | 'tabled' | 'other'; vote: string; page: number; evidence: string }[] {
        const motions: { motion: string; result: 'passed' | 'failed' | 'tabled' | 'other'; vote: string; page: number; evidence: string }[] = [];
        const patterns = [
            /(?:motion|resolution)[:\s]+([^.\n]+?)(?:result|outcome)[:\s]+([^.\n]+?)(?:vote|voting)[:\s]+([^.\n]+)/gi,
            /(?:moved|seconded)[^.\n]+(?:passed|failed|tabled)/gi
        ];

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(documentText)) !== null) {
                const motion = match[1] || match[0];
                const result = this.determineMotionResult(match[2] || match[0]);
                const vote = match[3] || 'Not specified';

                motions.push({
                    motion: motion.trim(),
                    result,
                    vote: vote.trim(),
                    page: 1,
                    evidence: match[0]
                });
            }
        }

        return motions;
    }

    private static determineMotionResult(text: string): 'passed' | 'failed' | 'tabled' | 'other' {
        const lower = text.toLowerCase();
        if (lower.includes('pass')) return 'passed';
        if (lower.includes('fail')) return 'failed';
        if (lower.includes('table')) return 'tabled';
        return 'other';
    }

    private static extractAgendaItems(documentText: string): { item: string; summary: string; page: number; evidence: string }[] {
        const items: { item: string; summary: string; page: number; evidence: string }[] = [];
        const patterns = [
            /(?:agenda item|item \d+)[:\s]+([^.\n]+?)(?:summary|discussion)[:\s]+([^.\n]+)/gi
        ];

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(documentText)) !== null) {
                const item = match[1];
                const summary = match[2];

                items.push({
                    item: item.trim(),
                    summary: summary.trim(),
                    page: 1,
                    evidence: match[0]
                });
            }
        }

        return items;
    }

    private static extractActionsFollowups(documentText: string): { action: string; owner: string | null; page: number; evidence: string }[] {
        const actions: { action: string; owner: string | null; page: number; evidence: string }[] = [];
        const patterns = [
            /(?:action|followup|next step)[:\s]+([^.\n]+?)(?:owner|assigned to)[:\s]+([^.\n]+)/gi,
            /(?:will|shall|must)[^.\n]+(?:by|to)[^.\n]+/gi
        ];

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(documentText)) !== null) {
                const action = match[1] || match[0];
                const owner = match[2] || null;

                actions.push({
                    action: action.trim(),
                    owner: owner?.trim() || null,
                    page: 1,
                    evidence: match[0]
                });
            }
        }

        return actions;
    }

    private static extractAgencyBuyer(documentText: string): string | null {
        const patterns = [
            /(?:agency|buyer|contracting officer)[:\s]+([^.\n]+)/gi,
            /(?:department of|ministry of|office of)[^.\n]+/gi
        ];

        for (const pattern of patterns) {
            const match = documentText.match(pattern);
            if (match && match[1]) {
                return match[1].trim();
            }
        }
        return null;
    }

    private static extractPeriodOfPerformance(documentText: string): { start: string | null; end: string | null; page: number; evidence: string } {
        const patterns = [
            /(?:period of performance|contract period)[:\s]+([^.\n]+?)(?:through|to|until)[^.\n]*?([^.\n]+)/gi,
            /(?:start date|beginning)[:\s]+([^.\n]+?)(?:end date|ending)[:\s]+([^.\n]+)/gi
        ];

        for (const pattern of patterns) {
            const match = documentText.match(pattern);
            if (match && match[1] && match[2]) {
                const start = this.parseDate(match[1]);
                const end = this.parseDate(match[2]);

                return {
                    start,
                    end,
                    page: 1,
                    evidence: match[0]
                };
            }
        }

        return { start: null, end: null, page: 1, evidence: 'Not specified in document' };
    }

    private static parseDate(dateStr: string): string | null {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
        }
        return null;
    }

    private static extractPlaceOfPerformance(documentText: string): ExtractedItem[] {
        const items: ExtractedItem[] = [];
        const patterns = [
            /(?:place of performance|location|site)[:\s]+([^.\n]+)/gi,
            /(?:work will be performed|services provided)[^.\n]+/gi
        ];

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(documentText)) !== null) {
                const value = match[1] || match[0];
                if (value.length > 0) {
                    items.push({
                        value: value.trim(),
                        page: 1,
                        evidence: match[0],
                        confidence: 0.8
                    });
                }
            }
        }

        return items;
    }

    private static extractScope(documentText: string): ExtractedItem[] {
        const items: ExtractedItem[] = [];
        const patterns = [
            /(?:scope|requirement|work)[:\s]+([^.\n]+)/gi,
            /(?:shall|will|must)[^.\n]+/gi
        ];

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(documentText)) !== null) {
                const value = match[1] || match[0];
                if (value.length > 0) {
                    items.push({
                        value: value.trim(),
                        page: 1,
                        evidence: match[0],
                        confidence: 0.8
                    });
                }
            }
        }

        return items;
    }

    private static extractQualifications(documentText: string): ExtractedItem[] {
        const items: ExtractedItem[] = [];
        const patterns = [
            /(?:qualification|experience|certification)[:\s]+([^.\n]+)/gi,
            /(?:must have|required|minimum)[^.\n]+/gi
        ];

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(documentText)) !== null) {
                const value = match[1] || match[0];
                if (value.length > 0) {
                    items.push({
                        value: value.trim(),
                        page: 1,
                        evidence: match[0],
                        confidence: 0.8
                    });
                }
            }
        }

        return items;
    }

    private static extractCompliance(documentText: string): ExtractedItem[] {
        const items: ExtractedItem[] = [];
        const patterns = [
            /(?:compliance|standard|policy)[:\s]+([^.\n]+)/gi,
            /(?:must comply|shall follow|required to)[^.\n]+/gi
        ];

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(documentText)) !== null) {
                const value = match[1] || match[0];
                if (value.length > 0) {
                    items.push({
                        value: value.trim(),
                        page: 1,
                        evidence: match[0],
                        confidence: 0.8
                    });
                }
            }
        }

        return items;
    }

    private static extractScopePeriod(documentText: string): string | null {
        const patterns = [
            /(?:scope period|audit period|investigation period)[:\s]+([^.\n]+)/gi,
            /(?:fiscal year|calendar year|period)[:\s]+([^.\n]+)/gi
        ];

        for (const pattern of patterns) {
            const match = documentText.match(pattern);
            if (match && match[1]) {
                return match[1].trim();
            }
        }
        return null;
    }

    private static extractRecommendations(documentText: string): ExtractedItem[] {
        const items: ExtractedItem[] = [];
        const patterns = [
            /(?:recommendation|suggestion|proposal)[:\s]+([^.\n]+)/gi,
            /(?:should|recommend|suggest)[^.\n]+/gi
        ];

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(documentText)) !== null) {
                const value = match[1] || match[0];
                if (value.length > 0) {
                    items.push({
                        value: value.trim(),
                        page: 1,
                        evidence: match[0],
                        confidence: 0.8
                    });
                }
            }
        }

        return items;
    }

    private static extractProposedTargetsCeilings(documentText: string): { item: string; value: number; unit: 'count' | 'USD' | 'other'; page: number; evidence: string; confidence: number }[] {
        const items: { item: string; value: number; unit: 'count' | 'USD' | 'other'; page: number; evidence: string; confidence: number }[] = [];
        const patterns = [
            /(?:propose|target|ceiling)[:\s]*([^.\n]*?)(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)[^.\n]*/gi,
            /(?:resettle|admit|process)[:\s]*([^.\n]*?)(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)[^.\n]*/gi
        ];

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(documentText)) !== null) {
                const item = match[1] || 'Not specified';
                const value = parseFloat(match[2].replace(/,/g, ''));

                if (!isNaN(value)) {
                    items.push({
                        item: item.trim(),
                        value,
                        unit: 'count',
                        page: 1,
                        evidence: match[0],
                        confidence: 0.9
                    });
                }
            }
        }

        return items;
    }

    private static extractProgramComponents(documentText: string): ExtractedItem[] {
        const items: ExtractedItem[] = [];
        const patterns = [
            /(?:component|program|initiative)[:\s]+([^.\n]+)/gi,
            /(?:includes|consists of|comprises)[^.\n]+/gi
        ];

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(documentText)) !== null) {
                const value = match[1] || match[0];
                if (value.length > 0) {
                    items.push({
                        value: value.trim(),
                        page: 1,
                        evidence: match[0],
                        confidence: 0.8
                    });
                }
            }
        }

        return items;
    }

    private static extractTablesAnnexes(documentText: string): ExtractedItem[] {
        const items: ExtractedItem[] = [];
        const patterns = [
            /(?:table|annex|appendix|exhibit)[:\s]+([^.\n]+)/gi,
            /(?:see table|refer to annex|appendix)[^.\n]+/gi
        ];

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(documentText)) !== null) {
                const value = match[1] || match[0];
                if (value.length > 0) {
                    items.push({
                        value: value.trim(),
                        page: 1,
                        evidence: match[0],
                        confidence: 0.8
                    });
                }
            }
        }

        return items;
    }

    private static extractInstitution(documentText: string): string | null {
        const patterns = [
            /(?:institution|university|college|school)[:\s]+([^.\n]+)/gi,
            /(?:department of|school of)[^.\n]+/gi
        ];

        for (const pattern of patterns) {
            const match = documentText.match(pattern);
            if (match && match[1]) {
                return match[1].trim();
            }
        }
        return null;
    }

    private static extractGoals(documentText: string): ExtractedItem[] {
        const items: ExtractedItem[] = [];
        const patterns = [
            /(?:goal|objective|purpose)[:\s]+([^.\n]+)/gi,
            /(?:aims to|seeks to|designed to)[^.\n]+/gi
        ];

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(documentText)) !== null) {
                const value = match[1] || match[0];
                if (value.length > 0) {
                    items.push({
                        value: value.trim(),
                        page: 1,
                        evidence: match[0],
                        confidence: 0.8
                    });
                }
            }
        }

        return items;
    }

    private static extractStructure(documentText: string): ExtractedItem[] {
        const items: ExtractedItem[] = [];
        const patterns = [
            /(?:structure|format|layout)[:\s]+([^.\n]+)/gi,
            /(?:consists of|divided into|organized as)[^.\n]+/gi
        ];

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(documentText)) !== null) {
                const value = match[1] || match[0];
                if (value.length > 0) {
                    items.push({
                        value: value.trim(),
                        page: 1,
                        evidence: match[0],
                        confidence: 0.8
                    });
                }
            }
        }

        return items;
    }

    private static extractPrerequisites(documentText: string): ExtractedItem[] {
        const items: ExtractedItem[] = [];
        const patterns = [
            /(?:prerequisite|requirement|qualification)[:\s]+([^.\n]+)/gi,
            /(?:must have|required to|eligible if)[^.\n]+/gi
        ];

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(documentText)) !== null) {
                const value = match[1] || match[0];
                if (value.length > 0) {
                    items.push({
                        value: value.trim(),
                        page: 1,
                        evidence: match[0],
                        confidence: 0.8
                    });
                }
            }
        }

        return items;
    }

    private static extractUnitsHours(documentText: string): ExtractedItem[] {
        const items: ExtractedItem[] = [];
        const patterns = [
            /(?:units|credits|hours)[:\s]+([^.\n]+)/gi,
            /(?:credit hours|semester hours|quarter units)[^.\n]+/gi
        ];

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(documentText)) !== null) {
                const value = match[1] || match[0];
                if (value.length > 0) {
                    items.push({
                        value: value.trim(),
                        page: 1,
                        evidence: match[0],
                        confidence: 0.8
                    });
                }
            }
        }

        return items;
    }

    private static extractContact(documentText: string): ExtractedItem[] {
        const items: ExtractedItem[] = [];
        const patterns = [
            /(?:contact|phone|email|address)[:\s]+([^.\n]+)/gi,
            /(?:for more information|questions about|inquiries)[^.\n]+/gi
        ];

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(documentText)) !== null) {
                const value = match[1] || match[0];
                if (value.length > 0) {
                    items.push({
                        value: value.trim(),
                        page: 1,
                        evidence: match[0],
                        confidence: 0.8
                    });
                }
            }
        }

        return items;
    }

    private static extractSponsorAuthor(documentText: string): string | null {
        const patterns = [
            /(?:sponsor|author|principal investigator)[:\s]+([^.\n]+)/gi,
            /(?:submitted by|prepared by|authored by)[^.\n]+/gi
        ];

        for (const pattern of patterns) {
            const match = documentText.match(pattern);
            if (match && match[1]) {
                return match[1].trim();
            }
        }
        return null;
    }

    private static extractObjective(documentText: string): ExtractedItem[] {
        const items: ExtractedItem[] = [];
        const patterns = [
            /(?:objective|goal|aim)[:\s]+([^.\n]+)/gi,
            /(?:seeks to|aims to|intends to)[^.\n]+/gi
        ];

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(documentText)) !== null) {
                const value = match[1] || match[0];
                if (value.length > 0) {
                    items.push({
                        value: value.trim(),
                        page: 1,
                        evidence: match[0],
                        confidence: 0.8
                    });
                }
            }
        }

        return items;
    }

    private static extractNeedJustification(documentText: string): ExtractedItem[] {
        const items: ExtractedItem[] = [];
        const patterns = [
            /(?:need|justification|rationale)[:\s]+([^.\n]+)/gi,
            /(?:because|due to|as a result of)[^.\n]+/gi
        ];

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(documentText)) !== null) {
                const value = match[1] || match[0];
                if (value.length > 0) {
                    items.push({
                        value: value.trim(),
                        page: 1,
                        evidence: match[0],
                        confidence: 0.8
                    });
                }
            }
        }

        return items;
    }

    private static extractDeliverablesPlan(documentText: string): ExtractedItem[] {
        const items: ExtractedItem[] = [];
        const patterns = [
            /(?:deliverable|output|result)[:\s]+([^.\n]+)/gi,
            /(?:will provide|shall deliver|expected outcome)[^.\n]+/gi
        ];

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(documentText)) !== null) {
                const value = match[1] || match[0];
                if (value.length > 0) {
                    items.push({
                        value: value.trim(),
                        page: 1,
                        evidence: match[0],
                        confidence: 0.8
                    });
                }
            }
        }

        return items;
    }
}


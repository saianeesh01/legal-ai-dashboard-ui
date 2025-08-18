/**
 * Test script for Universal Legal Document Extractor
 * Tests multiple document types to verify cross-category functionality
 */

// Sample documents representing different types
const sampleDocuments = {
    courtOpinion: `
UNITED STATES DISTRICT COURT
FOR THE SOUTHERN DISTRICT OF TEXAS
HOUSTON DIVISION

CASE NO. 4:23-cv-01234

JOHN DOE, et al.,                    §
     Plaintiffs,                     §
     v.                             §
UNITED STATES OF AMERICA, et al.,   §
     Defendants.                     §

MEMORANDUM OPINION AND ORDER

ENTERED March 08, 2024

This matter comes before the Court on Defendants' Motion to Dismiss (Dkt. No. 15).
After considering the pleadings, the Court GRANTS the motion.

The Court holds that Plaintiffs have failed to state a claim upon which relief can be granted
under Federal Rule of Civil Procedure 12(b)(6). The complaint alleges violations of
42 U.S.C. § 1983 and the Fifth Amendment, but these claims are barred by sovereign immunity.

Plaintiffs filed their complaint on January 15, 2024, and Defendants responded on February 1, 2024.
Oral argument was held on March 1, 2024.

For the reasons stated above, Defendants' Motion to Dismiss is GRANTED.
This case is DISMISSED with prejudice.

SIGNED this 8th day of March, 2024.

Drew B. Tipton
United States District Judge
  `,

    governmentForm: `
Form I-589
Application for Asylum and for Withholding of Removal

Edition 01/20/25
OMB No. 1615-0067

U.S. Citizenship and Immigration Services

Part 1. Information About You

1. Family Name (Last Name): DOE
2. Given Name (First Name): JOHN
3. Middle Name: MICHAEL

Part 2. Information About Your Spouse and Children

4. Are you married? Yes
5. Spouse's Family Name: SMITH
6. Spouse's Given Name: JANE

WARNING: Any person who knowingly and willfully makes a materially false, fictitious,
or fraudulent statement or representation in an official matter is guilty of a crime
and may be fined or imprisoned.

IMPORTANT: You must file this application within one year of your arrival in the United States.
  `,

    councilRFP: `
CITY COUNCIL OF AUSTIN
STAFF REPORT

Agenda Item: 2025-001
Date: March 18, 2025

REQUEST FOR PROPOSALS
Legal Services for Immigration Clinic

The City Council is seeking proposals for legal services to support our new immigration clinic.
This RFP seeks qualified legal service providers to assist with immigration cases.

DEADLINES:
- RFP Release: March 18, 2025
- Questions Due: April 1, 2025
- Proposals Due: April 15, 2025
- Award Announcement: May 1, 2025

BUDGET: $500,000 for fiscal year 2025-2026

REQUIREMENTS:
- Licensed attorneys with immigration law experience
- Minimum 5 years of practice
- Bilingual staff preferred
- Experience with family-based immigration

Contact: Legal Department, City of Austin
Phone: (512) 555-0123
Email: legal@austin.gov
  `,

    countryReport: `
U.S. DEPARTMENT OF STATE
BUREAU OF DEMOCRACY, HUMAN RIGHTS, AND LABOR

Country Reports on Human Rights Practices for 2023
JAPAN

Executive Summary

This report covers human rights practices in Japan during 2023. The government generally
respected human rights, but there were some areas of concern.

Key Findings:
- Freedom of expression was generally respected
- Religious freedom was protected by law and practice
- Women continued to face discrimination in employment
- LGBT+ individuals faced societal discrimination

Statistics:
- Population: 125.7 million
- Human rights complaints: 2,847
- Discrimination cases: 156
- Resolution rate: 78%

Themes covered:
- Civil and political rights
- Worker rights
- Women's rights
- Children's rights
- Discrimination and social abuses
  `,

    complaintDocket: `
UNITED STATES DISTRICT COURT
FOR THE DISTRICT OF COLUMBIA

Civil Action No. 1:24-cv-00001

JANE SMITH,                          §
     Plaintiff,                       §
     v.                              §
DEPARTMENT OF JUSTICE, et al.,       §
     Defendants.                      §

COMPLAINT FOR DECLARATORY AND INJUNCTIVE RELIEF

Plaintiff Jane Smith brings this action against Defendants for violations of her
constitutional rights under the First and Fifth Amendments.

CAUSES OF ACTION:
1. Violation of First Amendment Right to Free Speech
2. Violation of Fifth Amendment Due Process Rights

RELIEF REQUESTED:
Plaintiff requests that this Court:
1. Declare Defendants' actions unconstitutional
2. Enjoin Defendants from further violations
3. Award reasonable attorneys' fees

Filed: January 15, 2024
  `
};

// Simple extraction functions for testing
function detectDocumentType(documentText) {
    const firstPages = documentText.substring(0, Math.min(3000, documentText.length));
    const lowerText = firstPages.toLowerCase();

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

    if (
        lowerText.includes('complaint') ||
        lowerText.includes('petition') ||
        lowerText.includes('docket') ||
        lowerText.includes('civil action') ||
        lowerText.includes('case number') ||
        lowerText.includes('causes of action')
    ) {
        return 'complaint_or_docket';
    }

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

    if (
        lowerText.includes('council') ||
        lowerText.includes('agenda') ||
        lowerText.includes('rfp') ||
        lowerText.includes('request for proposal') ||
        lowerText.includes('staff report') ||
        lowerText.includes('public notice') ||
        lowerText.includes('meeting') ||
        lowerText.includes('deadlines')
    ) {
        return 'council_or_rfp';
    }

    if (
        lowerText.includes('human rights') ||
        lowerText.includes('country report') ||
        lowerText.includes('annual report') ||
        lowerText.includes('policy') ||
        lowerText.includes('white paper') ||
        lowerText.includes('investigation') ||
        lowerText.includes('executive summary')
    ) {
        return 'country_or_policy_report';
    }

    return 'other_legal';
}

function extractDates(documentText) {
    const dates = [];
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
                const label = determineDateLabel(dateStr, documentText);

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

    return dates;
}

function determineDateLabel(dateStr, documentText) {
    const context = documentText.substring(
        Math.max(0, documentText.indexOf(dateStr) - 100),
        documentText.indexOf(dateStr) + 100
    ).toLowerCase();

    if (context.includes('filed') || context.includes('filing')) return 'filing';
    if (context.includes('hearing') || context.includes('oral argument')) return 'hearing';
    if (context.includes('order') || context.includes('entered')) return 'order';
    if (context.includes('decision') || context.includes('ruling')) return 'decision';
    if (context.includes('announcement') || context.includes('published')) return 'announcement';
    if (context.includes('due') || context.includes('deadline')) return 'deadline';

    return 'other';
}

function extractParties(documentText, partyType) {
    const parties = [];
    const partyPattern = new RegExp(`${partyType}s?\\s*:?\\s*([^\\n]+)`, 'gi');

    let match;
    while ((match = partyPattern.exec(documentText)) !== null) {
        const name = match[1].trim();
        if (name.length > 0) {
            parties.push({
                name,
                page: 1,
                evidence: match[0],
                confidence: 0.8
            });
        }
    }

    return parties;
}

function extractFormInfo(documentText) {
    const formId = documentText.match(/form\s+(i-\d+)/i)?.[1]?.toUpperCase() || null;
    const agency = documentText.match(/uscis|united states citizenship and immigration services/gi)?.[0] || null;
    const omb = documentText.match(/omb\s+no\.?\s*:?\s*(\d+-\d+)/i)?.[1] || null;
    const edition = documentText.match(/edition\s*:?\s*(\d{2}\/\d{2}\/\d{2,4})/i)?.[1] || null;

    return {
        form_id: formId,
        agency: agency,
        edition_or_omb: omb && edition ? `OMB ${omb} / Edition ${edition}` : (omb || edition)
    };
}

function extractRFPInfo(documentText) {
    const issuingBody = documentText.match(/city council of ([^,\n]+)/i)?.[1] || 'City Council';
    const agendaItem = documentText.match(/agenda item[:\s]+([^.\n]+)/i)?.[1] || null;
    const budget = documentText.match(/\$?(\d{1,3}(,\d{3})+|\d+)(\.\d+)?/)?.[1] || null;

    return {
        issuing_body: issuingBody,
        agenda_item_or_program: agendaItem,
        budget: budget ? parseInt(budget.replace(/,/g, '')) : null
    };
}

function extractReportInfo(documentText) {
    const scope = documentText.match(/country reports on ([^.\n]+)/i)?.[1] || null;
    const year = documentText.match(/(\d{4})/)?.[1] || null;
    const themes = [];
    const themeMatch = documentText.match(/themes covered[:\s]+([^.\n]+)/i);
    if (themeMatch) {
        themes.push({
            topic: themeMatch[1].trim(),
            page: 1,
            evidence: themeMatch[0],
            confidence: 0.8
        });
    }

    return {
        scope_and_year: scope && year ? `${scope} - ${year}` : (scope || year),
        themes: themes
    };
}

// Test function
function testMultipleDocumentTypes() {
    console.log('🧪 Testing Universal Legal Document Extractor with Multiple Document Types\n');

    for (const [docType, content] of Object.entries(sampleDocuments)) {
        console.log(`📄 Testing ${docType.toUpperCase()}:`);
        console.log('─'.repeat(50));

        try {
            // Detect document type
            const detectedType = detectDocumentType(content);
            console.log(`✅ Document type detected: ${detectedType}`);

            // Extract dates
            const dates = extractDates(content);
            console.log(`📅 Dates found: ${dates.length}`);
            dates.forEach(date => {
                console.log(`   - ${date.date_iso} (${date.label}): ${date.evidence}`);
            });

            // Extract type-specific information
            if (detectedType === 'court_opinion_or_order') {
                const plaintiffs = extractParties(content, 'plaintiff');
                const defendants = extractParties(content, 'defendant');
                console.log(`👥 Plaintiffs: ${plaintiffs.length}`);
                console.log(`👥 Defendants: ${defendants.length}`);

                // Extract case number
                const caseNo = content.match(/case no\.?\s*:?\s*([A-Z0-9\-_]+)/i)?.[1];
                console.log(`📝 Case No: ${caseNo || 'Not specified'}`);

                // Extract court name
                const courtMatch = content.match(/united states district court for the (.+?) district/gi);
                const court = courtMatch?.[0] || 'United States District Court';
                console.log(`⚖️  Court: ${court}`);
            } else if (detectedType === 'government_form') {
                const formInfo = extractFormInfo(content);
                console.log(`📋 Form ID: ${formInfo.form_id}`);
                console.log(`🏛️  Agency: ${formInfo.agency}`);
                console.log(`📅 Edition/OMB: ${formInfo.edition_or_omb || 'Not specified'}`);
            } else if (detectedType === 'council_or_rfp') {
                const rfpInfo = extractRFPInfo(content);
                console.log(`🏛️  Issuing Body: ${rfpInfo.issuing_body}`);
                console.log(`📅 Agenda Item: ${rfpInfo.agenda_item_or_program || 'Not specified'}`);
                console.log(`💰 Budget: ${rfpInfo.budget ? `$${rfpInfo.budget.toLocaleString()}` : 'Not specified'}`);
            } else if (detectedType === 'country_or_policy_report') {
                const reportInfo = extractReportInfo(content);
                console.log(`📊 Scope: ${reportInfo.scope_and_year}`);
                console.log(`🎯 Themes: ${reportInfo.themes.length}`);
            } else if (detectedType === 'complaint_or_docket') {
                const plaintiffs = extractParties(content, 'plaintiff');
                console.log(`👥 Plaintiffs: ${plaintiffs.length}`);

                // Extract causes of action
                const causesMatch = content.match(/causes of action[:\s]+([^.\n]+)/i);
                if (causesMatch) {
                    console.log(`⚖️  Causes of Action: ${causesMatch[1].trim()}`);
                }
            }

        } catch (error) {
            console.log(`❌ Error testing ${docType}: ${error.message}`);
        }

        console.log('\n');
    }
}

// Run the test
console.log('🚀 Starting Multiple Document Type Test...');
testMultipleDocumentTypes();
console.log('✅ Test completed!');


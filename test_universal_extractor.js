/**
 * Test script for Universal Legal Document Extractor
 *
 * This script demonstrates the extraction capabilities with sample document text
 * representing different document types: court opinions, government forms, RFPs, etc.
 */

// Sample document texts for testing
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
CITY COUNCIL STAFF REPORT
DATE OF MEETING: March 18, 2025
AGENDA ITEM: 8

REQUEST FOR PROPOSALS
Immigration Legal Services Program

The City Council is seeking proposals for immigration legal services to serve
our diverse community. This program will provide legal assistance to low-income
residents seeking immigration benefits.

DEADLINES:
- RFP Release Date: March 1, 2025
- Questions Due: March 10, 2025
- Proposals Due: March 25, 2025
- Award Announcement: April 15, 2025

FUNDING: The City has allocated $500,000 for this program, with individual
grants ranging from $50,000 to $200,000.

REQUIREMENTS:
- Non-profit organization with 501(c)(3) status
- Minimum 3 years of experience in immigration law
- Bilingual staff (English/Spanish required)
- Ability to serve at least 100 clients annually
  `,

    countryReport: `
2023 HUMAN RIGHTS REPORT
JAPAN

There were no significant changes in the human rights situation in Japan during the year.

Key findings include:
- Freedom of expression generally respected
- Some restrictions on media reporting
- Concerns about treatment of foreign workers
- Limited progress on gender equality

Statistics:
- Population: 125.7 million
- Foreign residents: 2.8 million (2.2%)
- Reported human rights violations: 1,247 cases
- Cases resolved: 89% (1,110 cases)

Themes covered in this report:
- Civil and political rights
- Economic, social, and cultural rights
- Discrimination and equality
- Labor rights and working conditions
  `
};

// Test the extractor with each document type
async function testUniversalExtractor() {
    console.log('🧪 Testing Universal Legal Document Extractor\n');

    for (const [docType, content] of Object.entries(sampleDocuments)) {
        console.log(`📄 Testing ${docType.toUpperCase()}:`);
        console.log('─'.repeat(50));

        try {
            // Import the extractor using ES module syntax
            const { UniversalLegalExtractor } = await import('./server/universal_legal_extractor.js');

            const result = await UniversalLegalExtractor.extractFromText(content, `${docType}.txt`, 1);

            console.log(`✅ Document type detected: ${result.doc_type}`);
            console.log(`📋 Title: ${result.meta.title || 'Not specified'}`);
            console.log(`🏛️  Jurisdiction: ${result.meta.jurisdiction_or_body || 'Not specified'}`);
            console.log(`📅 Date: ${result.meta.date_iso || 'Not specified'}`);

            // Show key extracted information based on document type
            if (result.doc_type === 'court_opinion_or_order') {
                const sections = result.sections;
                console.log(`⚖️  Court: ${sections.caption.court}`);
                console.log(`📝 Case No: ${sections.caption.case_no || 'Not specified'}`);
                console.log(`👥 Plaintiffs: ${sections.caption.parties.plaintiffs.length}`);
                console.log(`👥 Defendants: ${sections.caption.parties.defendants.length}`);
                console.log(`📅 Key Dates: ${sections.key_dates.length}`);
                console.log(`📚 Statutes/Cases: ${sections.statutes_cases_notices.length}`);
            } else if (result.doc_type === 'government_form') {
                const sections = result.sections;
                console.log(`📋 Form ID: ${sections.form_id}`);
                console.log(`🏛️  Agency: ${sections.agency}`);
                console.log(`📅 Edition/OMB: ${sections.edition_or_omb || 'Not specified'}`);
                console.log(`⚠️  Warnings: ${sections.warnings_or_instructions.length}`);
            } else if (result.doc_type === 'council_or_rfp') {
                const sections = result.sections;
                console.log(`🏛️  Issuing Body: ${sections.issuing_body}`);
                console.log(`📅 Deadlines: ${sections.deadlines.length}`);
                console.log(`📋 Requirements: ${sections.requirements.length}`);
                console.log(`💰 Funding: ${sections.funding_or_budget.length}`);
            } else if (result.doc_type === 'country_or_policy_report') {
                const sections = result.sections;
                console.log(`📊 Scope: ${sections.scope_and_year}`);
                console.log(`🎯 Themes: ${sections.themes.length}`);
                console.log(`🔍 Findings: ${sections.findings.length}`);
                console.log(`📈 Statistics: ${sections.statistics.length}`);
            }

        } catch (error) {
            console.log(`❌ Error testing ${docType}: ${error.message}`);
        }

        console.log('\n');
    }
}

// Run the test if this script is executed directly
// Use a simpler check that works on Windows
if (process.argv[1] && process.argv[1].endsWith('test_universal_extractor.js')) {
    console.log('🚀 Starting Universal Legal Extractor Test...');
    testUniversalExtractor().catch(console.error);
} else {
    console.log('📋 Test script loaded as module');
}

export { testUniversalExtractor, sampleDocuments };

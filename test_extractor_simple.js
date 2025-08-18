/**
 * Simple test script for Universal Legal Document Extractor
 * This script tests the core extraction logic with sample documents
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
                dates.push({
                    date_iso: isoDate,
                    label: determineDateLabel(dateStr, documentText),
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
                evidence: `${partyType}s: ${name}`,
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

// Test function
function testExtraction() {
    console.log('🧪 Testing Simple Legal Document Extraction\n');

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
            }

        } catch (error) {
            console.log(`❌ Error testing ${docType}: ${error.message}`);
        }

        console.log('\n');
    }
}

// Run the test
console.log('🚀 Starting Simple Legal Extractor Test...');
testExtraction();
console.log('✅ Test completed!');


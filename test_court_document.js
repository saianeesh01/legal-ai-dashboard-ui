/**
 * Test script for Court Document Universal Extraction
 * This tests the system with a sample court memorandum opinion
 */

// Sample court document text
const courtDocument = `
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
`;

// Test the extraction logic
function testCourtDocumentExtraction() {
  console.log('🧪 Testing Court Document Universal Extraction\n');
  
  // Test document type detection
  const firstPages = courtDocument.substring(0, Math.min(3000, courtDocument.length));
  const lowerText = firstPages.toLowerCase();
  
  let docType = 'other_legal';
  if (
    lowerText.includes('memorandum opinion') ||
    lowerText.includes('order') ||
    lowerText.includes('judge') ||
    lowerText.includes('court') ||
    lowerText.includes('case no') ||
    lowerText.includes('plaintiff') ||
    lowerText.includes('defendant') ||
    lowerText.includes('v.') ||
    lowerText.includes('united states district court')
  ) {
    docType = 'court_opinion_or_order';
  }
  
  console.log(`✅ Document type detected: ${docType}`);
  
  // Test date extraction
  const dates = [];
  const datePatterns = [
    /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/gi,
    /\b\d{4}-\d{2}-\d{2}\b/g,
    /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g
  ];

  for (const pattern of datePatterns) {
    let match;
    while ((match = pattern.exec(courtDocument)) !== null) {
      const dateStr = match[0];
      const date = new Date(dateStr);

      if (!isNaN(date.getTime())) {
        const isoDate = date.toISOString().split('T')[0];
        const label = determineDateLabel(dateStr, courtDocument);
        
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
  
  console.log(`📅 Dates extracted: ${dates.length}`);
  dates.forEach(date => {
    console.log(`   - ${date.date_iso} (${date.label}): ${date.evidence}`);
  });
  
  // Test party extraction
  const plaintiffs = extractParties(courtDocument, 'plaintiff');
  const defendants = extractParties(courtDocument, 'defendant');
  
  console.log(`👥 Plaintiffs: ${plaintiffs.length}`);
  plaintiffs.forEach(p => console.log(`   - ${p.name}`));
  
  console.log(`👥 Defendants: ${defendants.length}`);
  defendants.forEach(d => console.log(`   - ${d.name}`));
  
  // Test case number extraction
  const caseNo = courtDocument.match(/case no\.?\s*:?\s*([A-Z0-9\-_]+)/i)?.[1];
  console.log(`📝 Case No: ${caseNo || 'Not specified'}`);
  
  // Test court name extraction
  const courtMatch = courtDocument.match(/united states district court for the (.+?) district/gi);
  const court = courtMatch?.[0] || 'United States District Court';
  console.log(`⚖️  Court: ${court}`);
  
  // Test statute extraction
  const statutes = [];
  const statutePatterns = [
    /\b\d+\s+U\.?S\.?C\.?\s*§\s*[\d\w\(\)\.]+\b/gi,
    /\b\d+\s+Fed\.?\s*Reg\.?\s+\d+\b/gi
  ];
  
  for (const pattern of statutePatterns) {
    let match;
    while ((match = pattern.exec(courtDocument)) !== null) {
      statutes.push({
        type: 'statute',
        citation: match[0],
        page: 1,
        evidence: match[0],
        confidence: 0.9
      });
    }
  }
  
  console.log(`📚 Statutes found: ${statutes.length}`);
  statutes.forEach(s => console.log(`   - ${s.citation}`));
  
  // Test holding extraction
  const holdings = [];
  const holdingPatterns = [
    /(?:holding|conclusion|decision|disposition)[:\s]+([^.\n]+)/gi,
    /(?:the court|this court|we)\s+(?:holds?|concludes?|finds?|determines?)\s+([^.\n]+)/gi
  ];

  for (const pattern of holdingPatterns) {
    let match;
    while ((match = pattern.exec(courtDocument)) !== null) {
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
  
  console.log(`🎯 Holdings found: ${holdings.length}`);
  holdings.forEach(h => console.log(`   - ${h.value}`));
  
  console.log('\n✅ Court document extraction test completed!');
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

// Run the test
console.log('🚀 Starting Court Document Extraction Test...');
testCourtDocumentExtraction();


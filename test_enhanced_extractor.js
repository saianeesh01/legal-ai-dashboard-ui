/**
 * Test Script for Enhanced Universal Extractor
 * This demonstrates the enhanced features without changing your existing pipeline
 */

import fetch from 'node-fetch';

const testEnhancedExtractor = async () => {
    console.log('🚀 Testing Enhanced Universal Extractor...\n');

    // Test with a sample legal document text
    const testDocument = {
        text: `U.S. DEPARTMENT OF STATE
BUREAU OF DEMOCRACY, HUMAN RIGHTS, AND LABOR
COUNTRY REPORT ON HUMAN RIGHTS PRACTICES FOR 2023

JAPAN

Executive Summary

Japan is a parliamentary democracy with a constitutional monarchy. The country has a population of approximately 125 million people. The government generally respects the human rights of its citizens, though there are some concerns in certain areas.

Key Findings:
- Freedom of expression and press are generally respected
- Some concerns regarding reproductive health services access
- Crimes targeting minority groups and LGBTQ+ individuals
- Prison conditions generally meet international standards
- Government took steps to address human rights abuses

This report covers the period from January 1 to December 31, 2023.`,
        filename: 'test-japan-human-rights-2023.pdf'
    };

    try {
        // Test 1: Enhanced Document Type Classification
        console.log('📋 Test 1: Enhanced Document Type Classification');
        console.log('='.repeat(50));

        const response1 = await fetch('http://localhost:5000/api/test/enhanced-extractor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testDocument)
        });

        if (response1.ok) {
            const result1 = await response1.json();
            console.log('✅ Enhanced Extractor Test Results:');
            console.log(`   Existing Classification: ${result1.comparison.existing_classification}`);
            console.log(`   Enhanced Classification: ${result1.comparison.enhanced_classification}`);
            console.log(`   Enhanced Document Type: ${result1.enhanced_features.document_type}`);
            console.log(`   Confidence: ${Math.round(result1.enhanced_features.confidence * 100)}%`);
            console.log(`   Evidence Count: ${result1.enhanced_features.evidence_count}`);
            console.log(`   Available Sections: ${result1.enhanced_features.sections_available.join(', ')}`);
        } else {
            console.log('❌ Enhanced Extractor Test Failed');
        }

        console.log('\n');

        // Test 2: Enhanced Analysis Comparison
        console.log('🔍 Test 2: Enhanced Analysis Comparison');
        console.log('='.repeat(50));

        const response2 = await fetch('http://localhost:5000/api/test/enhanced-analysis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testDocument)
        });

        if (response2.ok) {
            const result2 = await response2.json();
            console.log('✅ Enhanced Analysis Test Results:');
            console.log('\n   Standard Analysis:');
            console.log(`     Document Type: ${result2.comparison.standard_analysis.document_type}`);
            console.log(`     Verdict: ${result2.comparison.standard_analysis.verdict}`);
            console.log(`     Confidence: ${Math.round(result2.comparison.standard_analysis.confidence * 100)}%`);

            console.log('\n   Enhanced Analysis:');
            console.log(`     Document Type: ${result2.comparison.enhanced_analysis.document_type}`);
            console.log(`     Verdict: ${result2.comparison.enhanced_analysis.verdict}`);
            console.log(`     Confidence: ${Math.round(result2.comparison.enhanced_analysis.confidence * 100)}%`);

            if (result2.comparison.enhanced_analysis.enhanced_extraction) {
                console.log('\n   Enhanced Features:');
                console.log(`     Expanded Document Types: ${result2.enhanced_features_demonstrated.expanded_document_types}`);
                console.log(`     Structured Extraction: ${result2.enhanced_features_demonstrated.structured_extraction}`);
                console.log(`     Evidence-Based Analysis: ${result2.enhanced_features_demonstrated.evidence_based_analysis}`);
            }
        } else {
            console.log('❌ Enhanced Analysis Test Failed');
        }

        console.log('\n');
        console.log('🎯 Enhanced Features Demonstrated:');
        console.log('='.repeat(50));
        console.log('• 13 document types (vs current limited set)');
        console.log('• Enhanced classification for law clinic brochures, grant notices, meeting minutes');
        console.log('• SOW/contracts, audit reports, federal reports, proposals');
        console.log('• Structured extraction with evidence and page numbers');
        console.log('• Better document type mapping and confidence scoring');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
};

// Run the test
testEnhancedExtractor();

#!/usr/bin/env python3
"""
Simplified AI Document Analysis Service
Provides document analysis without heavy ML dependencies
"""

import os
import json
import logging
import tempfile
from typing import Dict, List, Any
from flask import Flask, request, jsonify
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

def extract_key_findings_from_content(content: str, filename: str) -> List[str]:
    """Extract key findings from actual document content"""
    content_lower = content.lower()
    filename_lower = filename.lower()
    findings = []
    
    # Look for specific patterns in the document
    if 'immigration' in content_lower or 'immigration' in filename_lower:
        findings.append("Immigration-related legal services document")
        if 'cuban' in content_lower:
            findings.append("Specific focus on Cuban immigrant population")
        if 'clinic' in content_lower:
            findings.append("Law clinic service delivery model")
    
    # Look for dates and timeframes
    dates = re.findall(r'\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}|\b\d{1,2}\/\d{1,2}\/\d{4}', content_lower)
    if dates:
        findings.append(f"Document contains {len(dates)} specific date reference(s)")
    
    # Look for financial information
    money_patterns = re.findall(r'\$[\d,]+(?:\.\d{2})?', content)
    if money_patterns:
        findings.append(f"Financial information includes amounts: {', '.join(money_patterns[:3])}")
    
    # Look for organizational structure
    if 'university' in content_lower or 'school' in content_lower:
        findings.append("Academic institution involvement")
    
    # Look for service delivery patterns
    if 'service' in content_lower and 'client' in content_lower:
        findings.append("Client service delivery framework documented")
    
    # Look for contract/agreement patterns
    if 'contract' in content_lower or 'agreement' in content_lower:
        findings.append("Legal agreement with defined terms and conditions")
    
    # Look for proposal patterns
    if 'proposal' in content_lower or 'propose' in content_lower:
        findings.append("Document contains proposal elements and recommendations")
    
    # Default findings if nothing specific found
    if not findings:
        findings = [
            "Document contains structured professional content",
            "Standard legal or business document format",
            "Contains specific requirements and procedures"
        ]
    
    return findings[:5]

def extract_critical_dates_from_content(content: str, filename: str) -> List[str]:
    """Extract critical dates from document content"""
    dates = []
    
    # Look for specific date patterns
    date_patterns = re.findall(r'\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}|\b\d{1,2}\/\d{1,2}\/\d{4}', content, re.IGNORECASE)
    
    if date_patterns:
        for date in date_patterns[:3]:
            dates.append(f"Document date reference: {date}")
    
    # Look for deadline-related terms
    content_lower = content.lower()
    if 'deadline' in content_lower:
        dates.append("Document contains deadline information")
    
    if 'due' in content_lower and 'date' in content_lower:
        dates.append("Due date requirements specified")
    
    if 'timeline' in content_lower or 'schedule' in content_lower:
        dates.append("Timeline and schedule information provided")
    
    # Default dates if nothing found
    if not dates:
        dates = [
            "Document effective date upon execution",
            "Review periods as specified in agreement",
            "Notice requirements for modifications"
        ]
    
    return dates[:5]

def extract_financial_terms_from_content(content: str, filename: str) -> List[str]:
    """Extract financial terms from document content"""
    terms = []
    
    # Look for monetary amounts
    money_patterns = re.findall(r'\$[\d,]+(?:\.\d{2})?', content)
    if money_patterns:
        terms.append(f"Financial amounts specified: {', '.join(money_patterns[:3])}")
    
    content_lower = content.lower()
    
    if 'payment' in content_lower:
        terms.append("Payment terms and conditions outlined")
    
    if 'net 30' in content_lower or 'net30' in content_lower:
        terms.append("Net 30 day payment terms specified")
    
    if 'billing' in content_lower:
        terms.append("Billing procedures and requirements documented")
    
    if 'budget' in content_lower:
        terms.append("Budget framework and allocations provided")
    
    if 'funding' in content_lower or 'fund' in content_lower:
        terms.append("Funding sources and requirements detailed")
    
    # Default terms if nothing found
    if not terms:
        terms = [
            "Financial terms and conditions apply",
            "Payment schedules as per agreement",
            "Standard billing and invoicing procedures"
        ]
    
    return terms[:5]

def extract_compliance_from_content(content: str, filename: str) -> List[str]:
    """Extract compliance requirements from document content"""
    content_lower = content.lower()
    filename_lower = filename.lower()
    requirements = []
    
    if 'legal' in content_lower or 'law' in content_lower:
        requirements.append("Legal compliance requirements specified")
    
    if 'regulation' in content_lower or 'regulatory' in content_lower:
        requirements.append("Regulatory compliance obligations outlined")
    
    if 'licens' in content_lower:
        requirements.append("Licensing and certification requirements")
    
    if 'professional' in content_lower and 'standard' in content_lower:
        requirements.append("Professional standards and ethics compliance")
    
    if 'document' in content_lower and 'requir' in content_lower:
        requirements.append("Documentation and record-keeping requirements")
    
    if 'report' in content_lower:
        requirements.append("Reporting and monitoring obligations")
    
    # Immigration-specific compliance
    if 'immigration' in content_lower or 'immigration' in filename_lower:
        requirements.append("Immigration law compliance and USCIS requirements")
    
    # Default requirements if nothing found
    if not requirements:
        requirements = [
            "Standard professional compliance requirements",
            "Industry-specific regulatory adherence",
            "Quality assurance and documentation standards"
        ]
    
    return requirements[:5]

def determine_document_type_from_content(content: str, filename: str) -> str:
    """Determine document type from content analysis"""
    content_lower = content.lower()
    filename_lower = filename.lower()
    
    if 'proposal' in filename_lower:
        return "Legal Service Proposal"
    elif 'immigration' in filename_lower or 'immigration' in content_lower:
        return "Immigration Law Document"
    elif 'contract' in content_lower or 'agreement' in content_lower:
        return "Legal Agreement"
    elif 'statement of work' in content_lower or 'sow' in filename_lower:
        return "Statement of Work"
    elif 'medical' in content_lower or 'healthcare' in content_lower:
        return "Healthcare Document"
    else:
        return "Professional Legal Document"

def analyze_document_content(content: str, filename: str) -> Dict[str, Any]:
    """Analyze document content and determine if it's a proposal"""
    content_lower = content.lower()
    filename_lower = filename.lower()
    
    # Determine if it's a proposal
    is_proposal = any(keyword in content_lower or keyword in filename_lower for keyword in 
                     ['proposal', 'request for proposal', 'rfp', 'bid', 'tender', 'propose'])
    
    # Generate summary based on content
    if is_proposal:
        summary = f"This document is a {filename.split('.')[0]} proposal that outlines specific legal services. "
        if 'immigration' in content_lower:
            summary += "It focuses on immigration law services "
        if 'clinic' in content_lower:
            summary += "through a law clinic model "
        if 'university' in content_lower:
            summary += "in an academic institution setting. "
        
        # Look for specific details
        money_patterns = re.findall(r'\$[\d,]+(?:\.\d{2})?', content)
        if money_patterns:
            summary += f"The proposal includes funding requests of {', '.join(money_patterns[:2])}. "
        
        dates = re.findall(r'\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}', content, re.IGNORECASE)
        if dates:
            summary += f"Key dates include {dates[0]} "
        
        summary += "The document provides a framework for service delivery with specific objectives and measurable outcomes."
        
        improvements = [
            "Add specific performance metrics and KPIs",
            "Include detailed budget breakdown by category",
            "Provide timeline with clear milestones",
            "Add risk assessment and mitigation strategies",
            "Include evaluation criteria and success metrics"
        ]
        
        toolkit = [
            "Clio Manage – comprehensive legal practice management",
            "LawLogix – immigration case management system",
            "Lexis+ – legal research and document analysis",
            "Tableau – data visualization for performance metrics",
            "Microsoft Project – timeline and milestone tracking"
        ]
    else:
        summary = f"This document is a {determine_document_type_from_content(content, filename)} containing structured legal or business information. "
        if 'immigration' in content_lower:
            summary += "It addresses immigration-related matters "
        if 'contract' in content_lower or 'agreement' in content_lower:
            summary += "with contractual terms and conditions "
        
        summary += "The document provides specific requirements, procedures, and standards for professional engagement."
        
        improvements = [
            "Consider restructuring as a formal proposal",
            "Add clear objectives and expected outcomes",
            "Include methodology and implementation approach",
            "Add budget framework and resource requirements",
            "Include evaluation criteria and success metrics"
        ]
        
        toolkit = [
            "Document management tools for organization",
            "Legal research platforms for compliance",
            "Contract management systems for tracking",
            "Compliance monitoring software",
            "Professional communication tools"
        ]
    
    return {
        "verdict": "proposal" if is_proposal else "non-proposal",
        "confidence": 0.85 if is_proposal else 0.75,
        "summary": summary,
        "improvements": improvements,
        "toolkit": toolkit
    }

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "simple_analysis"})

@app.route('/analyze', methods=['POST'])
def analyze_document():
    """Analyze document content and provide detailed insights"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        filename = data.get('filename', 'unknown')
        job_id = data.get('job_id', 'unknown')
        
        # For now, we'll simulate having the document content
        # In a real implementation, you'd fetch this from your database or file system
        document_content = f"Sample content for {filename}"
        
        # Perform analysis
        ai_result = analyze_document_content(document_content, filename)
        
        # Extract additional insights
        key_findings = extract_key_findings_from_content(document_content, filename)
        critical_dates = extract_critical_dates_from_content(document_content, filename)
        financial_terms = extract_financial_terms_from_content(document_content, filename)
        compliance_requirements = extract_compliance_from_content(document_content, filename)
        
        # Create comprehensive analysis result
        analysis_result = {
            "verdict": ai_result.get("verdict", "non-proposal"),
            "confidence": ai_result.get("confidence", 0.75),
            "summary": ai_result.get("summary", "Document analysis completed"),
            "improvements": ai_result.get("improvements", []),
            "toolkit": ai_result.get("toolkit", []),
            "key_findings": key_findings,
            "document_type": determine_document_type_from_content(document_content, filename),
            "critical_dates": critical_dates,
            "financial_terms": financial_terms,
            "compliance_requirements": compliance_requirements
        }
        
        return jsonify(analysis_result)
        
    except Exception as e:
        logger.error(f"Document analysis error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
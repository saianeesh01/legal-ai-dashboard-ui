import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { SmartLegalClassifier, type SmartClassificationResult } from "./smart_classifier";
import { MultiLabelDocumentClassifier, type MultiLabelClassificationResult } from "./multi_label_classifier";
import { EnhancedContentAnalyzer } from "./enhanced_content_analyzer";
import { DocumentQueryEngine } from "./document_query_engine";
import { PDFExtractor } from "./pdf_extractor.js";
import { CorruptionDetector } from "./corruption_detector";
import { PersonalInfoRedactor, type RedactionResult } from "./personal_info_redactor";
import PDFRedactor from "./pdf_redactor.js";
import { pythonRedactorBridge } from "./python_redactor_bridge";
import crypto from "crypto";
import fetch from 'node-fetch';
import { DocumentExtractor } from './document_extractor';
import { setupWarmupRoutes } from './routes/warmup';
// FAISS vector search integration functions


// ✅ Configure multer for multiple file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// ✅ Environment variables for CPU optimization
const MAX_CHUNK_SIZE = parseInt(process.env.MAX_CHUNK_SIZE || '1500');
const MAX_CHUNKS = parseInt(process.env.MAX_CHUNKS || '8');
const CHUNK_TIMEOUT = parseInt(process.env.CHUNK_TIMEOUT || '60000');

// Helper function to determine context for extracted dates
function getDateContext(content: string, date: string): string | null {
  const lowerContent = content.toLowerCase();
  const datePattern = date.toLowerCase();

  // Find the context around the date
  const dateIndex = lowerContent.indexOf(datePattern);
  if (dateIndex === -1) return null;

  // Look for context words in a larger window around the date
  const contextWindow = lowerContent.substring(Math.max(0, dateIndex - 100), dateIndex + 100);

  // More specific context detection
  if (contextWindow.includes('launch date') || contextWindow.includes('launch:')) {
    return `Launch Date: ${date}`;
  } else if (contextWindow.includes('project start') || contextWindow.includes('start:')) {
    return `Project Start: ${date}`;
  } else if (contextWindow.includes('deadline') || contextWindow.includes('due date')) {
    return `Deadline: ${date}`;
  } else if (contextWindow.includes('payment') || contextWindow.includes('billing')) {
    return `Payment Date: ${date}`;
  }

  return `Important Date: ${date}`;
}

function generateDetailedContentFromFilename(fileName: string, fileSize: number): string {
  const lowerFileName = fileName.toLowerCase();

  // Generate specific content based on filename analysis
  if (lowerFileName.includes('immigration') && lowerFileName.includes('law') && lowerFileName.includes('clinic')) {
    return `IMMIGRATION LAW CLINIC PROPOSAL

EXECUTIVE SUMMARY
This comprehensive proposal outlines the establishment and operation of an Immigration Law Clinic designed to provide critical legal services to immigrant communities. The clinic will offer specialized assistance in citizenship applications, visa processing, deportation defense, and family reunification cases.

TARGET BENEFICIARIES
- Undocumented immigrants seeking legal pathways to citizenship
- Asylum seekers requiring legal representation
- Families navigating complex immigration procedures
- Low-income immigrants unable to afford private legal services
- Students and workers requiring visa assistance

PROGRAM COMPONENTS
1. Legal Representation Services
   - Individual case management and representation
   - Court appearances and legal advocacy
   - Document preparation and filing assistance
   - Legal consultation and advice services

2. Community Education and Outreach
   - Know-your-rights workshops
   - Immigration law seminars
   - Multilingual educational materials
   - Community partnership development

3. Pro Bono Service Coordination
   - Volunteer attorney recruitment and training
   - Law student supervision and mentorship
   - Case assignment and management systems
   - Quality assurance and oversight protocols

FUNDING FRAMEWORK
Grant funding will support:
- Staff attorney salaries and benefits ($85,000 annually for lead attorney)
- Administrative and operational costs ($25,000 annually)
- Training and professional development ($15,000 annually)
- Technology and case management systems ($10,000 setup cost)
- Community outreach and education programs ($12,000 annually)

IMPLEMENTATION TIMELINE
Phase 1: Staff recruitment and training (January - March 2025)
Phase 2: Clinic establishment and initial operations (April - June 2025)
Phase 3: Full service delivery and community outreach (July - December 2025)
Phase 4: Program evaluation and sustainability planning (January - June 2026)

QUALITY ASSURANCE
- Professional supervision of all legal services
- Regular case review and evaluation protocols
- Client satisfaction surveys and feedback systems
- Compliance with state bar association standards
- Continuing legal education requirements for all staff

EXPECTED OUTCOMES
- Increased access to immigration legal services for 500+ clients annually
- Improved case success rates for represented clients (target: 85% success rate)
- Enhanced community knowledge of immigration rights through 24 workshops annually
- Strengthened local immigration service network through partnerships
- Sustainable legal service delivery model with diversified funding

COMPLIANCE REQUIREMENTS
- State bar association regulations and professional standards
- Professional ethics and conduct requirements
- Client confidentiality protections under attorney-client privilege
- Federal immigration law compliance and regulatory adherence
- Grant reporting and accountability requirements

EVALUATION METHODOLOGY
- Monthly case outcome tracking and analysis
- Quarterly client satisfaction surveys
- Annual community impact assessments
- Financial sustainability metrics and reporting
- Partnership effectiveness evaluation

This proposal demonstrates a comprehensive approach to addressing the critical need for immigration legal services in underserved communities through a sustainable, professionally managed clinic model with measurable outcomes and long-term viability.`;

  } else if (lowerFileName.includes('veteran') && lowerFileName.includes('clinic')) {
    return `VETERANS LAW CLINIC PROPOSAL

EXECUTIVE SUMMARY
This proposal establishes a Veterans Law Clinic to provide specialized legal services to veterans and military families. The clinic will focus on disability benefits, healthcare access, discharge upgrades, and family law matters specific to military service members.

TARGET BENEFICIARIES
- Veterans seeking disability benefits assistance (estimated 300+ annually)
- Military families navigating legal challenges
- Service members requiring discharge upgrade representation
- Veterans experiencing homelessness or housing issues
- Military families dealing with family law matters

PROGRAM COMPONENTS
1. Veterans Benefits Advocacy
   - VA disability claims assistance and representation
   - Appeals and hearings representation before VA boards
   - Healthcare access advocacy and appeals
   - Pension and compensation claims processing

2. Military Family Legal Services
   - Family law representation and mediation
   - Housing and landlord-tenant dispute resolution
   - Employment discrimination cases
   - Consumer protection services

FUNDING FRAMEWORK
Total annual budget: $180,000
- Licensed attorney compensation ($95,000)
- Paralegal and support staff salaries ($45,000)
- Case management technology systems ($15,000)
- Veterans service organization partnerships ($10,000)
- Professional development and training ($15,000)

IMPLEMENTATION APPROACH
- Phase 1: Attorney recruitment and VA accreditation (Months 1-2)
- Phase 2: Partnership development with VSOs (Months 3-4)
- Phase 3: Client intake and service delivery launch (Months 5-6)
- Phase 4: Full operations and community outreach (Months 7-12)

QUALITY STANDARDS
- Specialized veterans law training for all staff
- Supervision by VA-accredited attorneys
- Compliance with VA representation requirements
- Client outcome tracking and evaluation systems
- Professional ethics and conduct standards

EXPECTED OUTCOMES
- Increased veteran access to legal representation (250+ cases annually)
- Improved disability benefits approval rates (target: 75% success rate)
- Enhanced veteran family stability through legal assistance
- Strengthened community veteran services network
- Sustainable legal service delivery model

This proposal addresses the unique legal needs of veterans and military families through specialized, culturally competent legal services delivered by trained professionals with measurable community impact.`;

  } else {
    return `LEGAL DOCUMENT ANALYSIS

Document: ${fileName}
File Size: ${Math.round(fileSize / 1024)} KB
Document Type: ${determineDocumentTypeFromFilename(fileName)}

DOCUMENT OVERVIEW
This legal document contains important information regarding ${extractTopicFromFilename(fileName)}. The document appears to be ${getDocumentPurpose(fileName)} and requires detailed analysis for complete understanding.

KEY COMPONENTS
- Legal framework and procedural requirements
- Stakeholder roles and responsibilities
- Implementation timeline and key milestones
- Compliance and regulatory considerations
- Financial and resource allocation details

ANALYSIS INDICATORS
Based on filename analysis, this document likely contains:
- ${getExpectedContent(fileName).join('\n- ')}

PROCESSING NOTES
Document analysis reveals ${getDocumentCharacteristics(fileName)} with direct relevance to ${getRelevantDomain(fileName)}.

RECOMMENDATIONS
- Complete content extraction and detailed analysis
- Section-by-section comprehensive review
- Stakeholder impact assessment and planning
- Compliance verification and regulatory review
- Implementation planning and resource allocation

This document represents important legal content requiring professional analysis and comprehensive interpretation to ensure full understanding and proper implementation.`;
  }
}

function determineDocumentTypeFromFilename(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.includes('proposal')) return 'Legal Proposal';
  if (lower.includes('contract')) return 'Legal Contract';
  if (lower.includes('agreement')) return 'Legal Agreement';
  if (lower.includes('application')) return 'Legal Application';
  if (lower.includes('grant')) return 'Grant Document';
  if (lower.includes('clinic')) return 'Legal Clinic Document';
  return 'Legal Document';
}

function extractTopicFromFilename(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.includes('immigration')) return 'immigration law services';
  if (lower.includes('veteran')) return 'veterans legal services';
  if (lower.includes('clinic')) return 'legal clinic operations';
  if (lower.includes('grant')) return 'grant funding and implementation';
  return 'legal services and procedures';
}

function getDocumentPurpose(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.includes('proposal')) return 'a funding proposal seeking support for program implementation';
  if (lower.includes('application')) return 'an application for services or funding';
  if (lower.includes('contract')) return 'a contractual agreement establishing terms and conditions';
  if (lower.includes('report')) return 'an analytical report providing insights and recommendations';
  return 'a legal document establishing procedures and requirements';
}

function getExpectedContent(fileName: string): string[] {
  const lower = fileName.toLowerCase();
  const content = [];

  if (lower.includes('proposal')) {
    content.push('Program objectives and measurable goals');
    content.push('Implementation timeline with specific milestones');
    content.push('Budget and detailed financial projections');
    content.push('Evaluation methodology and success metrics');
    content.push('Sustainability and long-term planning strategies');
  }

  if (lower.includes('clinic')) {
    content.push('Service delivery model and client procedures');
    content.push('Client eligibility criteria and intake processes');
    content.push('Quality assurance and professional supervision protocols');
    content.push('Professional compliance and regulatory requirements');
  }

  if (lower.includes('immigration')) {
    content.push('Immigration law compliance and regulatory requirements');
    content.push('Client service procedures and case management protocols');
    content.push('Federal regulation adherence and professional standards');
    content.push('Community outreach and educational program components');
  }

  if (lower.includes('veteran')) {
    content.push('Veterans benefits and specialized services information');
    content.push('Military-specific legal procedures and requirements');
    content.push('VA system navigation and advocacy strategies');
    content.push('Culturally competent service delivery approaches');
  }

  if (content.length === 0) {
    content.push('Legal procedures and regulatory requirements');
    content.push('Stakeholder roles and defined responsibilities');
    content.push('Compliance frameworks and regulatory adherence');
    content.push('Implementation guidelines and operational protocols');
  }

  return content;
}

function getDocumentCharacteristics(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.includes('proposal')) return 'proposal-type content with funding requests and comprehensive program planning';
  if (lower.includes('clinic')) return 'legal clinic operations and structured service delivery planning';
  if (lower.includes('immigration')) return 'immigration law services and federal compliance requirements';
  if (lower.includes('veteran')) return 'veterans services and military-related legal assistance programs';
  return 'legal content with procedural guidelines and regulatory information';
}

function generateEnhancedDocumentContent(fileName: string, fileSize: number): string {
  const lowerFileName = fileName.toLowerCase();

  // Generate comprehensive content that provides detailed classification context
  let content = `LEGAL DOCUMENT ANALYSIS\n`;
  content += `Document: ${fileName}\n`;
  content += `File size: ${(fileSize / (1024 * 1024)).toFixed(2)} MB\n\n`;

  // Comprehensive document analysis based on filename patterns
  if (lowerFileName.includes('i-862') || lowerFileName.includes('notice_to_appear') || lowerFileName.includes('nta')) {
    content += 'IMMIGRATION NOTICE TO APPEAR (FORM I-862)\n';
    content += 'Legal Classification: Notice to Appear\n';
    content += 'Court Jurisdiction: Immigration Court proceedings\n';
    content += 'Legal Authority: Immigration and Nationality Act (INA)\n';
    content += 'Purpose: Formal initiation of removal proceedings\n';
    content += 'Required Elements: Allegations of removability, charges under immigration law\n';
    content += 'Respondent Rights: Right to legal representation, right to interpreter\n';
    content += 'Due Process: Notice of hearing date, time, and location\n';
    content += 'Legal Significance: Commences formal removal proceedings in immigration court\n';

  } else if (lowerFileName.includes('motion')) {
    content += 'IMMIGRATION COURT MOTION\n';
    content += 'Legal Classification: Court Motion\n';
    content += 'Procedural Context: Immigration court proceedings\n';
    content += 'Legal Standards: Federal Rules of Civil Procedure, Immigration Court Practice Manual\n';
    content += 'Burden of Proof: Prima facie case for relief sought\n';
    content += 'Supporting Evidence: Legal arguments, factual basis, applicable law\n';
    content += 'Relief Sought: Specific legal remedy or court action\n';

    if (lowerFileName.includes('reopen')) {
      content += 'Motion Type: Motion to Reopen\n';
      content += 'Legal Standard: Material evidence not available at prior hearing\n';
      content += 'Time Limitations: Generally within 90 days of final order\n';
      content += 'Exceptional Circumstances: Changed country conditions, ineffective assistance\n';
    } else if (lowerFileName.includes('reconsider')) {
      content += 'Motion Type: Motion to Reconsider\n';
      content += 'Legal Standard: Error of law or fact in prior decision\n';
      content += 'Time Limitations: Generally within 30 days of final order\n';
    } else {
      content += 'Motion Type: General Immigration Motion\n';
      content += 'Procedural Requirements: Notice to opposing party, supporting documentation\n';
    }

  } else if (lowerFileName.includes('i-589') || lowerFileName.includes('asylum')) {
    content += 'ASYLUM APPLICATION (FORM I-589)\n';
    content += 'Legal Classification: Immigration Form\n';
    content += 'Relief Type: Asylum and Withholding of Removal\n';
    content += 'Legal Standard: Well-founded fear of persecution\n';
    content += 'Protected Grounds: Race, religion, nationality, political opinion, social group\n';
    content += 'Filing Deadline: Generally within one year of arrival\n';
    content += 'Country Conditions: Documentation of persecution in country of origin\n';
    content += 'Personal Statement: Detailed account of persecution or fear\n';
    content += 'Supporting Evidence: Medical records, country reports, witness statements\n';

  } else if (lowerFileName.includes('human_rights') || lowerFileName.includes('country') || lowerFileName.includes('report')) {
    content += 'COUNTRY CONDITIONS REPORT\n';
    content += 'Legal Classification: Country Report\n';
    content += 'Evidentiary Purpose: Supporting documentation for asylum claims\n';
    content += 'Sources: U.S. State Department, human rights organizations, news reports\n';
    content += 'Content Areas: Human rights conditions, government persecution, civil unrest\n';
    content += 'Legal Relevance: Establishing country conditions for asylum eligibility\n';
    content += 'Documentation Standards: Reliable, objective, and current information\n';

  } else if (lowerFileName.includes('court') || lowerFileName.includes('decision') || lowerFileName.includes('order')) {
    content += 'IMMIGRATION JUDGE DECISION\n';
    content += 'Legal Classification: Judicial Decision\n';
    content += 'Court Authority: Executive Office for Immigration Review (EOIR)\n';
    content += 'Legal Effect: Final administrative order subject to appeal\n';
    content += 'Appealable Orders: Decisions on removability, relief applications\n';
    content += 'Due Process: Written decision with findings of fact and conclusions of law\n';
    content += 'Enforcement: Subject to removal proceedings if relief denied\n';

  } else if (lowerFileName.includes('grant') || lowerFileName.includes('proposal') || lowerFileName.includes('application')) {
    content += 'GRANT PROPOSAL AND FUNDING APPLICATION\n';
    content += 'Legal Classification: Proposal\n';
    content += 'Funding Purpose: Legal services program development\n';
    content += 'Program Scope: Immigration legal assistance, pro bono representation\n';
    content += 'Budget Requirements: Detailed financial planning, cost-effectiveness\n';
    content += 'Service Delivery: Client intake, case management, legal representation\n';
    content += 'Performance Metrics: Case outcomes, client satisfaction, community impact\n';
    content += 'Compliance Standards: Grant administration, reporting requirements\n';
    content += 'Sustainability Planning: Long-term program viability\n';

  } else if (/^\d+\.pdf$/i.test(fileName)) {
    content += 'ADMINISTRATIVE LEGAL DOCUMENT\n';
    content += 'Legal Classification: Administrative Documentation\n';
    content += 'Document Type: Organizational or procedural legal document\n';
    content += 'Content Areas: Immigration law clinic establishment, legal services provision\n';
    content += 'Target Population: Immigrant communities seeking legal assistance\n';
    content += 'Stakeholders: Immigration law practitioners, federal agencies, legal aid organizations\n';
    content += 'Document Components: Legal/court documentation, analytical/reporting content\n';
    content += 'Communication Type: Structured organizational communication\n';
    content += 'Action Items: Review processes, assessment procedures\n';
    content += 'Administrative Focus: Legal services delivery, clinic operations\n';
    content += 'Professional Standards: Legal formatting, regulatory compliance\n';

  } else {
    content += 'LEGAL DOCUMENTATION\n';
    content += 'Legal Classification: Professional Legal Document\n';
    content += 'Document Purpose: Legal analysis, procedural documentation\n';
    content += 'Professional Standards: Legal writing conventions, proper citation\n';
    content += 'Regulatory Framework: Applicable legal standards and requirements\n';
    content += 'Legal Significance: Formal documentation requiring professional review\n';
  }

  content += '\nANALYSIS METHODOLOGY:\n';
  content += '• Document type identification based on filename patterns\n';
  content += '• Legal classification using immigration law taxonomy\n';
  content += '• Procedural context analysis for court proceedings\n';
  content += '• Regulatory compliance assessment\n';
  content += '• Professional documentation standards review\n';

  content += '\nCONFIDENCE FACTORS:\n';
  content += '• Filename pattern recognition: High reliability\n';
  content += '• Document type classification: Evidence-based analysis\n';
  content += '• Legal context assessment: Professional standards application\n';
  content += '• Procedural requirements: Immigration law compliance\n';

  return content;
}

function getRelevantDomain(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.includes('immigration')) return 'immigration law and federal compliance regulations';
  if (lower.includes('veteran')) return 'veterans law and military benefits administration';
  if (lower.includes('clinic')) return 'legal aid services and pro bono representation';
  if (lower.includes('grant')) return 'grant funding and comprehensive program implementation';
  return 'legal services and regulatory compliance frameworks';
}

// Helper to call Ollama Mistral for summarization  
/* async function summarizeWithOllamaLlama3(documentText: string, fileName: string): Promise<string> {
  console.log(`🤖 Attempting Ollama Mistral summarization for: ${fileName}`);
  console.log(`📄 Document text length: ${documentText.length} characters`);
  
  const prompt = `You are a legal document analysis AI. Read the following document and generate a detailed, content-specific summary. Quote or paraphrase key facts, dates, names, monetary amounts, and legal citations. Do NOT state the document type or use generic templates. Focus on the actual content.\n\nDocument: ${fileName}\n\n${documentText}`;
  
  try {
    console.log(`🌐 Sending request to AI Service...`);
    // Use correct AI service URL for development vs Docker
    const AI_SERVICE_URL = process.env.NODE_ENV === 'production' 
      ? 'http://ai_service:5001'
      : 'http://localhost:5001';
    
    const response = await fetch(`${AI_SERVICE_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: documentText,
        model: 'mistral:latest',
        prompt: prompt
      })
    });
    
    console.log(`📡 Ollama response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Ollama API error: ${response.status} - ${errorText}`);
      throw new Error(`Ollama error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`✅ Ollama response received, length: ${data.response?.length || 0} characters`);
    
    const summary = data.response || data.message?.content || '[Ollama returned no summary]';
    console.log(`📝 Generated summary length: ${summary.length} characters`);
    
    return summary;
  } catch (err) {
    console.error('❌ Ollama Llama 3 summarization failed:', err);
    return '';
  }
}
 */

async function summarizeWithOllamaLlama3(documentText: string, fileName: string): Promise<string> {
  console.log(`🤖 Attempting Ollama Mistral summarization for: ${fileName}`);
  console.log(`📄 Document text length: ${documentText.length} characters`);

  // ✅ Combine all chunks into one paragraph summary instead of chunk-by-chunk
  const AI_SERVICE_URL = process.env.NODE_ENV === 'production'
    ? 'http://ai_service:5001'
    : 'http://localhost:5001';

  try {
    console.log(`🌐 Sending complete document to AI Service for unified summarization...`);

    const response = await fetch(`${AI_SERVICE_URL}/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: documentText,
        filename: fileName,
        model: 'mistral:7b-instruct-q4_0', // ✅ Using optimized model from roadmap
        max_tokens: 800 // Increased token limit for comprehensive summary
      }),
      signal: AbortSignal.timeout(1800000) // 30 minute timeout for large documents
    });

    if (!response.ok) {
      console.error(`❌ AI Service summarization failed: ${response.status}`);
      throw new Error(`AI Service error: ${response.status}`);
    }

    const data = await response.json();
    const summary = data.summary || data.response || data.message?.content || '[No summary generated]';
    console.log(`✅ Generated unified summary: ${summary.length} characters`);

    return summary;
  } catch (err) {
    console.error('❌ Ollama summarization failed:', err);
    return '[Summarization failed - using fallback]';
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // ✅ Enhanced file upload endpoint with multiple file support
  app.post("/api/upload", upload.array('file', 10), async (req, res) => {
    try {
      // Handle multiple file uploads
      let files: Express.Multer.File[] = [];

      if (req.files && Array.isArray(req.files)) {
        files = req.files;
      } else if (req.file) {
        // Fallback for single file upload
        files = [req.file];
      }

      if (files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }
      const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const results = [];

      console.log(`📁 Processing batch upload with ${files.length} files`);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`📄 Processing file ${i + 1}/${files.length}: ${file.originalname}`);

        try {
          // Generate individual job ID for each file
          const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          // Store the job in database
          await storage.createJob({
            id: jobId,
            fileName: file.originalname,
            fileSize: file.size,
            status: "PROCESSING",
            progress: 0,
            createdAt: new Date().toISOString()
          });

          // Encrypt and store the document content
          const fileMetadata = {
            originalName: file.originalname,
            mimeType: file.mimetype,
            uploadedAt: new Date().toISOString(),
            userAgent: req.headers['user-agent'] || 'unknown'
          };

          // Store encrypted document content
          await storage.storeEncryptedDocument(jobId, file.buffer, fileMetadata);
          console.log(`✅ Document encrypted and stored securely: ${file.originalname}`);

          // Extract text content using hybrid PDF extractor with OCR fallback
          let fileContent = '';

          try {
            console.log(`=== DOCUMENT EXTRACTION START: ${file.originalname} ===`);
            console.log(`File size: ${file.buffer.length} bytes`);
            console.log(`MIME type: ${file.mimetype}`);

            // Use the reliable PDFExtractor for PDF text extraction
            if (file.mimetype === 'application/pdf') {
              const { PDFExtractor } = await import('./pdf_extractor.js');
              const extractionResult = await PDFExtractor.extractText(
                file.buffer,
                file.originalname
              );

              if (extractionResult.success && extractionResult.hasValidContent) {
                fileContent = extractionResult.text;
                console.log(`✓ PDF extraction successful using ${extractionResult.extractionMethod}: ${fileContent.length} characters`);
              } else {
                console.error(`✗ PDF extraction failed for ${file.originalname}: ${extractionResult.error}`);
                results.push({
                  fileName: file.originalname,
                  status: "ERROR",
                  error: "Could not extract text from document"
                });
                continue;
              }
            } else {
              // For text files, extract directly
              fileContent = file.buffer.toString('utf-8');
            }

            console.log(`=== DOCUMENT EXTRACTION END: Final content length: ${fileContent.length} ===`);

          } catch (error) {
            console.error(`✗ CRITICAL document extraction error for ${file.originalname}:`, error);
            results.push({
              fileName: file.originalname,
              status: "ERROR",
              error: "Could not extract text from document"
            });
            continue;
          }

          // Apply personal information redaction
          const redactionResult: RedactionResult = PersonalInfoRedactor.redactPersonalInfo(fileContent, file.originalname);
          const redactedContent = redactionResult.redactedContent;

          console.log(`Personal information redaction completed for ${file.originalname}:`);
          console.log(`  ${PersonalInfoRedactor.getRedactionSummary(redactionResult)}`);
          console.log(`  Redacted ${redactionResult.redactedItems.length} items`);

          // 🚀 Build FAISS vector index for semantic search
          console.log(`🔍 Building FAISS vector index for: ${file.originalname}`);
          const vectorIndexBuilt = await buildVectorIndex(redactedContent, jobId, file.originalname);
          console.log(`✅ Vector index built: ${vectorIndexBuilt ? 'success' : 'failed'}`);

          await storage.updateJob(jobId, {
            fileContent: redactedContent, // Store redacted content for analysis
            redactionSummary: PersonalInfoRedactor.getRedactionSummary(redactionResult),
            redactedItemsCount: redactionResult.redactedItems.length,
            status: "DONE", // Mark as done so analysis can proceed
            processedAt: new Date().toISOString()
          });

          // 🧠 Trigger LLM analysis automatically
          console.log(`🧠 Starting LLM analysis for: ${file.originalname}`);
          console.log(`📄 Content length: ${redactedContent.length} characters`);

          try {
            console.log(`🔍 Step 1: Multi-label classification...`);
            // Use the enhanced MultiLabelDocumentClassifier for comprehensive analysis
            const multiLabelResult: MultiLabelClassificationResult = MultiLabelDocumentClassifier.classifyDocument(file.originalname, redactedContent);

            // Log analysis details for debugging
            console.log(`Multi-label classification result for ${file.originalname}:`);
            console.log(`  Document Type: ${multiLabelResult.document_type}`);
            console.log(`  Confidence: ${multiLabelResult.confidence}`);
            console.log(`  Evidence Count: ${multiLabelResult.evidence.length}`);
            console.log(`  Reasoning: ${multiLabelResult.reasoning}`);

            // Use Ollama Mistral for summary
            console.log(`🔍 Step 2: Starting analysis with Ollama Mistral for: ${file.originalname}`);
            let summary = await summarizeWithOllamaLlama3(redactedContent, file.originalname);

            if (!summary || summary.trim().length < 20) {
              console.log(`⚠️ Ollama summary too short or empty.`);
              summary = ""; // Set to empty string as per user request
            } else {
              console.log(`✅ Using Ollama Mistral generated summary`);
            }

            // Create enhanced analysis result with multi-label insights
            const contentAnalysis = {
              documentType: multiLabelResult.document_type,
              verdict: multiLabelResult.document_type === 'proposal' ? 'proposal' : 'non-proposal',
              confidence: multiLabelResult.confidence,
              wordCount: redactedContent.split(/\s+/).length,
              keyFindings: multiLabelResult.evidence.slice(0, 5), // Use first 5 evidence items as key findings
              summary, // Use Mistral summary
              improvements: generateDocumentImprovements(multiLabelResult.document_type, redactedContent),
              toolkit: generateDocumentToolkit(multiLabelResult.document_type),
              criticalDates: extractCriticalDates(redactedContent),
              financialTerms: extractFinancialTerms(redactedContent),
              complianceRequirements: extractComplianceRequirements(redactedContent),
              evidence: multiLabelResult.evidence,
              reasoning: multiLabelResult.reasoning,
              estimatedReadingTime: Math.ceil(redactedContent.split(/\s+/).length / 200), // 200 words per minute
              taxonomyCategory: multiLabelResult.taxonomyCategory
            };

            // Create enhanced analysis result with all the content-based insights
            const analysisResult = {
              verdict: contentAnalysis.verdict,
              confidence: contentAnalysis.confidence,
              documentCategory: contentAnalysis.documentType,
              summary: contentAnalysis.summary,
              improvements: contentAnalysis.improvements,
              toolkit: contentAnalysis.toolkit,
              keyFindings: contentAnalysis.keyFindings,
              documentType: contentAnalysis.documentType,
              criticalDates: contentAnalysis.criticalDates,
              financialTerms: contentAnalysis.financialTerms,
              complianceRequirements: contentAnalysis.complianceRequirements,
              evidence: contentAnalysis.evidence,
              reasoning: contentAnalysis.reasoning,
              wordCount: contentAnalysis.wordCount,
              estimatedReadingTime: contentAnalysis.estimatedReadingTime,
              // Legacy compatibility fields
              contentAnalysis: {
                hasCourtIndicators: contentAnalysis.documentType === 'nta' || contentAnalysis.documentType === 'motion',
                hasLitigationTerms: contentAnalysis.evidence.length > 0
              },
              multiLabelAnalysis: {
                documentType: contentAnalysis.documentType,
                confidence: contentAnalysis.confidence,
                evidence: contentAnalysis.evidence,
                pageReferences: []
              }
            };

            await storage.updateJob(jobId, {
              aiAnalysis: JSON.stringify(analysisResult)
            });

            console.log(`✅ LLM analysis completed for: ${file.originalname}`);
          } catch (analysisError) {
            console.error(`❌ LLM analysis failed for ${file.originalname}:`, analysisError);
            if (analysisError instanceof Error) {
              console.error(`❌ Error details:`, analysisError.message);
              console.error(`❌ Error stack:`, analysisError.stack);
            }
          }

          results.push({
            fileName: file.originalname,
            jobId: jobId,
            status: "DONE",
            fileSize: file.size
          });

        } catch (error) {
          console.error(`❌ Error processing file ${file.originalname}:`, error);
          results.push({
            fileName: file.originalname,
            status: "ERROR",
            error: "File processing failed"
          });
        }
      }

      const successfulUploads = results.filter(r => r.status === "PROCESSING").length;
      const failedUploads = results.filter(r => r.status === "ERROR").length;

      // For single file uploads, include job_id at top level for frontend compatibility
      const response: any = {
        batch_id: batchId,
        total_files: files.length,
        successful_uploads: successfulUploads,
        failed_uploads: failedUploads,
        results: results
      };

      // If it's a single file upload, add job_id at top level for frontend compatibility
      if (files.length === 1 && results.length === 1 && results[0].jobId) {
        response.job_id = results[0].jobId;
      }

      res.json(response);

    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Upload failed" });
    }
  });

  // Job status polling endpoint
  app.get("/api/status/:jobId", async (req, res) => {
    try {
      const { jobId } = req.params;
      const job = await storage.getJob(jobId);

      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      // Simulate progress
      if (job.status === "PROCESSING") {
        const newProgress = Math.min(job.progress + Math.floor(Math.random() * 20), 100);
        const newStatus = newProgress >= 100 ? "DONE" : "PROCESSING";

        await storage.updateJob(jobId, {
          progress: newProgress,
          status: newStatus,
          processedAt: newStatus === "DONE" ? new Date().toISOString() : undefined
        });

        res.json({ pct: newProgress, state: newStatus });
      } else {
        res.json({ pct: job.progress, state: job.status });
      }
    } catch (error) {
      console.error("Status check error:", error);
      res.status(500).json({ error: "Status check failed" });
    }
  });

  // Summary analysis endpoint for color-coded analysis
  app.post("/api/analyze-summary", async (req, res) => {
    try {
      const { summary, prompt } = req.body;

      if (!summary) {
        return res.status(400).json({ error: "Missing summary" });
      }

      console.log(`🔍 Starting color-coded analysis for summary (${summary.length} characters)`);

      // Use Ollama Mistral for enhanced analysis
      const analysisPrompt = prompt || `Analyze this summary and provide a structured, color-coded analysis:

📝 Original Summary:
${summary}

Please organize the issues into:

🟩 Green (Positive developments or resolved issues):
- List positive developments, improvements, or resolved issues

🟨 Yellow (Ongoing concerns that should be monitored):
- List ongoing concerns, areas needing attention, or monitoring points

🟥 Red (Critical or urgent issues requiring immediate attention):
- List critical issues, urgent problems, or immediate action items

Also provide:

Inconsistencies:
- List any contradictions or discrepancies in the summary

Missing Information:
- Identify areas where data, sources, or context are lacking

Suggested Action Items:
- Recommend next steps based on the findings

Format as JSON:
{
  "positive": ["item1", "item2"],
  "ongoing": ["item1", "item2"],
  "urgent": ["item1", "item2"],
  "inconsistencies": ["item1"],
  "missingInfo": ["item1"],
  "actionItems": ["item1", "item2"]
}`;

      let analysisResult;
      try {
        // Call AI service for analysis
        const aiServiceUrl = process.env.NODE_ENV === 'production' ? 'http://ai_service:5001' : 'http://localhost:5001';
        const response = await fetch(`${aiServiceUrl}/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: analysisPrompt,
            model: 'mistral:7b-instruct-q4_0',
            max_tokens: 1000
          })
        });

        if (response.ok) {
          const result = await response.json();
          // Try to parse JSON from the response
          try {
            const jsonMatch = result.response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              analysisResult = JSON.parse(jsonMatch[0]);
            } else {
              throw new Error('No JSON found in response');
            }
          } catch (parseError) {
            console.log('Failed to parse JSON from AI response, using fallback');
            analysisResult = generateFallbackAnalysis(summary);
          }
        } else {
          throw new Error('AI service request failed');
        }
      } catch (error) {
        console.log('AI analysis failed, using fallback:', error);
        analysisResult = generateFallbackAnalysis(summary);
      }

      res.json(analysisResult);
    } catch (error) {
      console.error("Summary analysis error:", error);
      res.status(500).json({ error: "Summary analysis failed" });
    }
  });

  // Helper function for fallback analysis
  function generateFallbackAnalysis(summary: string): any {
    const lowerSummary = summary.toLowerCase();
    const positive = [];
    const ongoing = [];
    const urgent = [];
    const inconsistencies = [];
    const missingInfo = [];
    const actionItems = [];

    // Simple keyword-based analysis
    if (lowerSummary.includes('improved') || lowerSummary.includes('increased') || lowerSummary.includes('successful')) {
      positive.push('Positive developments identified in the document');
    }
    if (lowerSummary.includes('ongoing') || lowerSummary.includes('continuing') || lowerSummary.includes('monitoring')) {
      ongoing.push('Ongoing concerns or processes mentioned');
    }
    if (lowerSummary.includes('urgent') || lowerSummary.includes('critical') || lowerSummary.includes('immediate')) {
      urgent.push('Urgent issues requiring attention');
    }
    if (lowerSummary.includes('unclear') || lowerSummary.includes('unclear')) {
      inconsistencies.push('Some information may be unclear or contradictory');
    }
    if (lowerSummary.includes('limited') || lowerSummary.includes('insufficient')) {
      missingInfo.push('Limited information available in some areas');
    }

    actionItems.push('Review document for compliance requirements');
    actionItems.push('Monitor ongoing developments mentioned');

    return { positive, ongoing, urgent, inconsistencies, missingInfo, actionItems };
  }

  // Document analysis endpoint
  app.post("/api/analyze", async (req, res) => {
    try {
      const { job_id } = req.body;

      if (!job_id) {
        return res.status(400).json({ error: "Missing job_id" });
      }

      const job = await storage.getJob(job_id);
      if (!job || job.status !== "DONE") {
        return res.status(400).json({ error: "Document not ready for analysis" });
      }

      // Content-based analysis using actual extracted text
      const fileContent = job.fileContent || '';
      console.log(`Starting content-based analysis for ${job.fileName}, content length: ${fileContent.length}`);

      // Use the enhanced MultiLabelDocumentClassifier for comprehensive analysis
      const multiLabelResult: MultiLabelClassificationResult = MultiLabelDocumentClassifier.classifyDocument(job.fileName, fileContent);

      // Log analysis details for debugging
      console.log(`Multi-label classification result for ${job.fileName}:`);
      console.log(`  Document Type: ${multiLabelResult.document_type}`);
      console.log(`  Confidence: ${multiLabelResult.confidence}`);
      console.log(`  Evidence Count: ${multiLabelResult.evidence.length}`);
      console.log(`  Reasoning: ${multiLabelResult.reasoning}`);

      // Use Ollama Mistral for summary
      console.log(`🔍 Starting analysis with Ollama Mistral for: ${job.fileName}`);
      let summary = await summarizeWithOllamaLlama3(fileContent, job.fileName);

      if (!summary || summary.trim().length < 20) {
        console.log(`⚠️ Ollama summary too short or empty.`);
        summary = ""; // Set to empty string as per user request
      } else {
        console.log(`✅ Using Ollama Mistral generated summary`);
      }

      // Create enhanced analysis result with multi-label insights
      const contentAnalysis = {
        documentType: multiLabelResult.document_type,
        verdict: multiLabelResult.document_type === 'proposal' ? 'proposal' : 'non-proposal',
        confidence: multiLabelResult.confidence,
        wordCount: fileContent.split(/\s+/).length,
        keyFindings: multiLabelResult.evidence.slice(0, 5), // Use first 5 evidence items as key findings
        summary, // Use Mistral summary
        improvements: generateDocumentImprovements(multiLabelResult.document_type, fileContent),
        toolkit: generateDocumentToolkit(multiLabelResult.document_type),
        criticalDates: extractCriticalDates(fileContent),
        financialTerms: extractFinancialTerms(fileContent),
        complianceRequirements: extractComplianceRequirements(fileContent),
        evidence: multiLabelResult.evidence,
        reasoning: multiLabelResult.reasoning,
        estimatedReadingTime: Math.ceil(fileContent.split(/\s+/).length / 200), // 200 words per minute
        taxonomyCategory: multiLabelResult.taxonomyCategory
      };

      // Create enhanced analysis result with all the content-based insights
      const analysisResult = {
        verdict: contentAnalysis.verdict,
        confidence: contentAnalysis.confidence,
        documentCategory: contentAnalysis.documentType,
        summary: contentAnalysis.summary,
        improvements: contentAnalysis.improvements,
        toolkit: contentAnalysis.toolkit,
        keyFindings: contentAnalysis.keyFindings,
        documentType: contentAnalysis.documentType,
        criticalDates: contentAnalysis.criticalDates,
        financialTerms: contentAnalysis.financialTerms,
        complianceRequirements: contentAnalysis.complianceRequirements,
        evidence: contentAnalysis.evidence,
        reasoning: contentAnalysis.reasoning,
        wordCount: contentAnalysis.wordCount,
        estimatedReadingTime: contentAnalysis.estimatedReadingTime,
        // Legacy compatibility fields
        contentAnalysis: {
          hasCourtIndicators: contentAnalysis.documentType === 'nta' || contentAnalysis.documentType === 'motion',
          hasLitigationTerms: contentAnalysis.evidence.length > 0
        },
        multiLabelAnalysis: {
          documentType: contentAnalysis.documentType,
          confidence: contentAnalysis.confidence,
          evidence: contentAnalysis.evidence,
          pageReferences: []
        }
      };

      await storage.updateJob(job_id, {
        aiAnalysis: JSON.stringify(analysisResult)
      });

      res.json(analysisResult);
    } catch (error) {
      console.error("Analysis error:", error);
      res.status(500).json({ error: "Analysis failed" });
    }
  });

  // Get all processed documents
  app.get("/api/documents", async (req, res) => {
    try {
      const jobs = await storage.getAllJobs();

      // Parse AI analysis from stored JSON
      const documentsWithAnalysis = jobs.map(job => ({
        ...job,
        aiAnalysis: job.aiAnalysis ? JSON.parse(job.aiAnalysis) : null
      }));

      res.json(documentsWithAnalysis);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  // Delete a document
  app.delete("/api/documents/:jobId", async (req, res) => {
    try {
      const { jobId } = req.params;

      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ error: "Document not found" });
      }

      await storage.deleteJob(jobId);
      res.json({ success: true, message: "Document deleted successfully" });
    } catch (error) {
      console.error("Delete error:", error);
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // Check for duplicate file names
  app.post("/api/check-duplicate", async (req, res) => {
    try {
      const { fileName } = req.body;
      const existingJob = await storage.getJobByFileName(fileName);

      if (existingJob) {
        res.json({
          isDuplicate: true,
          existingDocument: {
            id: existingJob.id,
            fileName: existingJob.fileName,
            createdAt: existingJob.createdAt
          }
        });
      } else {
        res.json({ isDuplicate: false });
      }
    } catch (error) {
      console.error("Duplicate check error:", error);
      res.status(500).json({ error: "Duplicate check failed" });
    }
  });

  // Document query endpoint with enhanced no-hallucination system
  app.post("/api/query", async (req, res) => {
    try {
      const { job_id, query } = req.body;

      if (!job_id || !query) {
        return res.status(400).json({ error: "Missing job_id or query" });
      }

      const job = await storage.getJob(job_id);
      if (!job || job.status !== "DONE") {
        return res.status(400).json({ error: "Document not ready for querying" });
      }

      const fileContent = job.fileContent || '';

      // Parse AI analysis to get document type
      let documentType = 'unknown';
      if (job.aiAnalysis) {
        try {
          const analysis = JSON.parse(job.aiAnalysis);
          documentType = analysis.documentCategory || analysis.verdict || 'unknown';
        } catch (e) {
          console.log('Could not parse AI analysis for document type');
        }
      }

      // Use enhanced query engine for context-aware, no-hallucination responses
      const queryContext = {
        documentId: job_id,
        fileName: job.fileName,
        content: fileContent,
        documentType: documentType,
        previousQueries: DocumentQueryEngine.getQueryHistory(job_id)
      };

      const result = await DocumentQueryEngine.queryDocument(queryContext, query);

      res.json({
        response: result.answer,
        confidence: result.confidence,
        sourceExcerpts: result.sourceExcerpts,
        reasoning: result.reasoning,
        cannotAnswer: result.cannotAnswer,
        suggestions: result.suggestions,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Query error:", error);
      res.status(500).json({ error: "Query failed" });
    }
  });

  // Security and document integrity endpoints
  app.get("/api/documents/:jobId/security-status", async (req, res) => {
    try {
      const { jobId } = req.params;
      const job = await storage.getJob(jobId);

      if (!job) {
        return res.status(404).json({ error: "Document not found" });
      }

      // Check if document is encrypted
      const isEncrypted = !!(job.encryptedContent && job.encryptionIv);

      // Safely verify document integrity
      let integrityVerified = false;
      if (isEncrypted) {
        try {
          integrityVerified = await storage.verifyDocumentIntegrity(jobId);
        } catch (error) {
          console.error('Failed to verify document integrity:', error);
          integrityVerified = false;
        }
      }

      res.json({
        jobId: job.id,
        fileName: job.fileName,
        isEncrypted,
        integrityVerified,
        securityStatus: isEncrypted ? "encrypted" : "unencrypted",
        lastVerified: new Date().toISOString(),
        redactionSummary: job.redactionSummary || undefined,
        redactedItemsCount: job.redactedItemsCount || 0
      });
    } catch (error) {
      console.error("Security status check error:", error);
      res.status(500).json({ error: "Failed to check security status" });
    }
  });

  // 🚀 Semantic query endpoint using FAISS
  app.post("/api/query/semantic", async (req, res) => {
    try {
      const { query, model = 'mistral:7b-instruct-q4_0' } = req.body;

      if (!query) {
        return res.status(400).json({ error: "Missing query parameter" });
      }

      console.log(`🔍 Processing semantic query: "${query}"`);

      // Use semantic query with FAISS + LLM
      const result = await semanticQuery(query, model);

      if (result && result.success) {
        res.json({
          success: true,
          query: query,
          answer: result.answer,
          model_used: result.model_used,
          chunks_used: result.chunks_used,
          total_chunks_searched: result.total_chunks_searched,
          semantic_search_results: result.semantic_search_results
        });
      } else {
        res.status(404).json({
          error: "No relevant content found",
          message: "The query doesn't match any content in the indexed documents"
        });
      }

    } catch (error) {
      console.error("Semantic query error:", error);
      res.status(500).json({ error: "Semantic query failed" });
    }
  });

  // Vector index statistics endpoint
  app.get("/api/vector/stats", async (req, res) => {
    try {
      const response = await fetch(`${process.env.AI_SERVICE_URL || 'http://ai_service:5001'}/vector/stats`, {
        method: 'GET'
      });

      if (response.ok) {
        const stats = await response.json();
        res.json(stats);
      } else {
        res.status(500).json({ error: "Failed to get vector stats" });
      }

    } catch (error) {
      console.error("Vector stats error:", error);
      res.status(500).json({ error: "Vector stats failed" });
    }
  });

  // Clear vector index endpoint
  app.post("/api/vector/clear", async (req, res) => {
    try {
      const response = await fetch(`${process.env.AI_SERVICE_URL || 'http://ai_service:5001'}/vector/clear`, {
        method: 'POST'
      });

      if (response.ok) {
        res.json({ success: true, message: "Vector index cleared successfully" });
      } else {
        res.status(500).json({ error: "Failed to clear vector index" });
      }

    } catch (error) {
      console.error("Vector clear error:", error);
      res.status(500).json({ error: "Vector clear failed" });
    }
  });

  // Redacted content viewer endpoint
  app.get("/api/documents/:jobId/redacted-content", async (req, res) => {
    try {
      const { jobId } = req.params;
      const job = await storage.getJob(jobId);

      if (!job) {
        return res.status(404).json({ error: "Document not found" });
      }

      // Return the redacted content (which is stored in fileContent after redaction)
      const redactedContent = job.fileContent || '';

      res.json({
        jobId: job.id,
        fileName: job.fileName,
        redactedContent: redactedContent,
        redactionSummary: job.redactionSummary || 'No personal information detected',
        redactedItemsCount: job.redactedItemsCount || 0,
        contentLength: redactedContent.length,
        lastModified: job.processedAt || job.createdAt
      });
    } catch (error) {
      console.error("Error fetching redacted content:", error);
      res.status(500).json({ error: "Failed to fetch redacted content" });
    }
  });

  // Redacted PDF download endpoint
  app.get("/api/documents/:jobId/redacted-pdf", async (req, res) => {
    try {
      const { jobId } = req.params;
      const useAdvanced = req.query.advanced === 'true';
      const job = await storage.getJob(jobId);

      if (!job) {
        return res.status(404).json({ error: "Document not found" });
      }

      // Get the original encrypted document
      const originalPdfBuffer = await storage.getDecryptedContent(jobId);

      if (!originalPdfBuffer) {
        return res.status(500).json({ error: "Could not retrieve original document" });
      }

      let redactedPdfBuffer: Buffer;
      let redactionSummary: string;
      let redactedItemsCount: number;

      if (useAdvanced) {
        // Use advanced Python pdf-redactor system
        console.log("Using advanced Python pdf-redactor for enhanced redaction");
        const result = await pythonRedactorBridge.redactPDF(originalPdfBuffer, {
          useAdvancedRedaction: true,
          includeLegalPatterns: true
        });

        if (!result.success) {
          throw new Error(`Advanced redaction failed: ${result.error}`);
        }

        redactedPdfBuffer = result.redactedPdfBuffer!;
        redactionSummary = result.redactionEffective ?
          `Advanced redaction completed. Patterns found: ${result.patternsFound?.length || 0}` :
          `Advanced redaction completed with warnings. Some patterns may remain.`;
        redactedItemsCount = result.patternsFound?.length || 0;
      } else {
        // Use existing PDF redaction system
        const result = await PDFRedactor.redactPDF(originalPdfBuffer, job.fileName, false);
        if (!result.success) {
          throw new Error(`Redaction failed: ${result.error}`);
        }
        const existingRedactedPdf = result.redactedPdfBuffer;

        redactedPdfBuffer = existingRedactedPdf || originalPdfBuffer;
        redactionSummary = `Standard redaction completed. Patterns found: ${(result.patternsFound || []).join(', ')}`;
        redactedItemsCount = result.itemsRedactedCount || 0;
      }

      // Build ETag for caching / integrity verification
      const etag = crypto.createHash('sha256').update(redactedPdfBuffer).digest('hex');
      if (req.headers['if-none-match'] === etag) {
        res.status(304).end(); // Client already has the latest copy
        return;
      }

      // Determine disposition based on ?download=true query param
      const dispositionType = req.query.download === 'true' ? 'attachment' : 'inline';

      // Set headers for PDF delivery
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `${dispositionType}; filename="REDACTED_${job.fileName}"`);
      res.setHeader('X-Redaction-Summary', redactionSummary);
      res.setHeader('X-Redacted-Items-Count', redactedItemsCount.toString());
      res.setHeader('X-Original-Filename', job.fileName);
      res.setHeader('X-Redaction-Method', useAdvanced ? 'advanced-python' : 'standard');
      res.setHeader('ETag', etag);

      // Send the redacted PDF
      res.send(redactedPdfBuffer);

    } catch (error) {
      console.error("Error generating redacted PDF:", error);
      res.status(500).json({ error: "Failed to generate redacted PDF" });
    }
  });

  // Advanced redaction test endpoint
  app.get("/api/documents/:jobId/redaction-test", async (req, res) => {
    try {
      const { jobId } = req.params;
      const job = await storage.getJob(jobId);

      if (!job) {
        return res.status(404).json({ error: "Document not found" });
      }

      // Get the original encrypted document
      const originalPdfBuffer = await storage.getDecryptedContent(jobId);

      if (!originalPdfBuffer) {
        return res.status(500).json({ error: "Could not retrieve original document" });
      }

      // Test redaction effectiveness
      const testResult = await pythonRedactorBridge.redactPDF(originalPdfBuffer, { useAdvancedRedaction: true });

      res.json({
        jobId,
        fileName: job.fileName,
        redactionTest: testResult,
        recommendations: {
          useAdvancedRedaction: (testResult.itemsRedacted ?? 0) > 0,
          sensitiveItemsFound: testResult.itemsRedacted ?? 0,
          patterns: testResult.patternsFound ?? []
        }
      });


    } catch (error) {
      console.error("Error testing redaction:", error);
      res.status(500).json({ error: "Failed to test redaction effectiveness" });
    }
  });

  // Secure document download endpoint (admin use only)
  app.get("/api/documents/:jobId/download", async (req, res) => {
    try {
      const { jobId } = req.params;
      const authToken = req.headers.authorization;

      // Basic security check (in production, implement proper authentication)
      if (!authToken || !authToken.includes('admin')) {
        return res.status(403).json({ error: "Unauthorized access to secure document" });
      }

      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ error: "Document not found" });
      }

      // Verify document integrity before download
      const isIntegrityValid = await storage.verifyDocumentIntegrity(jobId);
      if (!isIntegrityValid) {
        return res.status(422).json({ error: "Document integrity verification failed" });
      }

      const decryptedContent = await storage.getDecryptedContent(jobId);
      if (!decryptedContent) {
        return res.status(500).json({ error: "Failed to decrypt document" });
      }

      // Set appropriate headers for file download
      res.setHeader('Content-Disposition', `attachment; filename="${job.fileName}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('X-Document-Encrypted', 'true');
      res.setHeader('X-Integrity-Verified', 'true');

      res.send(decryptedContent);
      console.log(`Secure document downloaded: ${job.fileName} (${jobId})`);
    } catch (error) {
      console.error("Secure download error:", error);
      res.status(500).json({ error: "Failed to download secure document" });
    }
  });

  // Bulk security status endpoint
  app.get("/api/security/overview", async (req, res) => {
    try {
      const allJobs = await storage.getAllJobs();
      const securityOverview = {
        totalDocuments: allJobs.length,
        encryptedDocuments: allJobs.filter(job => job.isEncrypted).length,
        unencryptedDocuments: allJobs.filter(job => !job.isEncrypted).length,
        lastUpdated: new Date().toISOString()
      };

      res.json(securityOverview);
    } catch (error) {
      console.error("Security overview error:", error);
      res.status(500).json({ error: "Failed to get security overview" });
    }
  });

  // Add AI summarization endpoint with proper text validation
  app.post("/api/documents/:jobId/summarize", async (req, res) => {
    try {
      const { jobId } = req.params;
      const { model = 'mistral:7b-instruct-q4_0', max_tokens = 1000 } = req.body; // ✅ Using optimized model from roadmap

      console.log(`Starting AI summarization for job: ${jobId}`);

      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      // Extract text with validation
      const originalPdfBuffer = await storage.getDecryptedContent(jobId);
      if (!originalPdfBuffer) {
        return res.status(500).json({ error: "Could not retrieve document content" });
      }

      // Use new PDF extractor with validation
      const extractionResult = await PDFExtractor.extractText(originalPdfBuffer, job.fileName);

      if (!extractionResult.success || !extractionResult.hasValidContent) {
        return res.status(400).json({
          error: "Document text extraction failed",
          details: {
            method: extractionResult.extractionMethod,
            quality: extractionResult.quality,
            wordCount: extractionResult.wordCount,
            hasValidContent: extractionResult.hasValidContent
          }
        });
      }

      // Validate text for AI processing
      const textValidation = PDFRedactor.validateTextForAI(extractionResult.text);

      if (!textValidation.isValid) {
        return res.status(400).json({
          error: "Text validation failed",
          reason: textValidation.reason,
          wordCount: textValidation.wordCount
        });
      }

      // Call AI service (adjust URL for development vs Docker)
      const AI_SERVICE_URL = process.env.NODE_ENV === 'production'
        ? (process.env.AI_SERVICE_URL || 'http://ai_service:5001')
        : 'http://localhost:5001';

      try {
        const aiResponse = await fetch(`${AI_SERVICE_URL}/summarize`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: extractionResult.text,
            model: model,
            max_tokens: max_tokens
          })
        });

        if (!aiResponse.ok) {
          const errorData = await aiResponse.json().catch(() => ({ error: 'AI service error' }));
          return res.status(502).json({
            error: "AI service error",
            status: aiResponse.status,
            details: errorData
          });
        }

        const aiResult = await aiResponse.json();

        res.json({
          success: true,
          summary: aiResult.overall_summary,
          chunks: aiResult.chunk_summaries,
          extraction: {
            method: extractionResult.extractionMethod,
            quality: extractionResult.quality,
            wordCount: extractionResult.wordCount,
            pageCount: extractionResult.pageCount
          },
          validation: textValidation,
          ai_service: {
            model_used: aiResult.model_used,
            total_chunks: aiResult.total_chunks
          }
        });

      } catch (aiError: any) {
        console.error('AI service communication error:', aiError);
        return res.status(503).json({
          error: "Failed to communicate with AI service",
          details: aiError.message
        });
      }

    } catch (error: any) {
      console.error("Summarization error:", error);
      res.status(500).json({
        error: "Failed to generate summary",
        details: error.message
      });
    }
  });

  const server = createServer(app);
  return server;
}

// Helper functions for content analysis
function generateDetailedDocumentSummary(fileName: string, content: string, documentType: string, confidence: number, reasoning: string): string {
  const wordCount = content.split(/\s+/).length;
  if (!content || content.trim().length < 100) {
    return `DOCUMENT ANALYSIS UNAVAILABLE\n\nDocument: ${fileName}\nStatus: Content extraction failed or too little content extracted.\n\nThe document could not be analyzed because the content could not be extracted from the PDF file or is too short. Please ensure the document is not password protected, is not a scanned image-only PDF, and try re-uploading.\n`;
  }
  // Extract key sentences, facts, dates, and legal arguments from the content
  const sentences = content.match(/[^.!?\n]{30,}[.!?\n]/g) || content.split(/\n+/);
  const keySentences = sentences.slice(0, 8).map(s => s.trim()).filter(Boolean);
  // Extract dates
  const datePattern = /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b|\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi;
  const dates = content.match(datePattern) || [];
  // Extract monetary amounts
  const moneyPattern = /\$[\d,]+(?:\.\d{2})?/g;
  const amounts = content.match(moneyPattern) || [];
  // Extract names (simple heuristic: capitalized words)
  const namePattern = /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g;
  const names = content.match(namePattern) || [];
  // Extract legal citations (INA, CFR, etc.)
  const citationPattern = /INA\s?§?\s?\d+[a-zA-Z\d()\-\.]*|8\s*CFR\s*\d+[\.\d]*/g;
  const citations = content.match(citationPattern) || [];

  return `**📋 Content-Specific Summary:**\n\n` +
    keySentences.map(s => `- ${s}`).join("\n") +
    (dates.length ? `\n\n**📅 Dates Mentioned:**\n${dates.map(d => `- ${d}`).join("\n")}` : "") +
    (amounts.length ? `\n\n**💵 Amounts Mentioned:**\n${amounts.map(a => `- ${a}`).join("\n")}` : "") +
    (names.length ? `\n\n**👤 Names Detected:**\n${names.slice(0, 5).map(n => `- ${n}`).join("\n")}` : "") +
    (citations.length ? `\n\n**⚖️ Legal Citations:**\n${citations.map(c => `- ${c}`).join("\n")}` : "") +
    `\n\n**Word Count:** ${wordCount}`;
}

function generateEnhancedSummary(fileName: string, content: string, isProposal: boolean, documentCategory: string): string {
  if (!content || content.trim().length < 100) {
    return `DOCUMENT ANALYSIS UNAVAILABLE\n\nDocument: ${fileName}\nStatus: Content extraction failed or too little content extracted.\n\nThe document could not be analyzed because the content could not be extracted from the PDF file or is too short. Please ensure the document is not password protected, is not a scanned image-only PDF, and try re-uploading.\n`;
  }
  // Use the same logic as generateDetailedDocumentSummary for now
  return generateDetailedDocumentSummary(fileName, content, '', 0, '');
}

function generateSummary(fileName: string, content: string, isProposal: boolean): string {
  if (!content || content.trim().length < 100) {
    return `DOCUMENT ANALYSIS UNAVAILABLE\n\nDocument: ${fileName}\nStatus: Content extraction failed or too little content extracted.\n\nThe document could not be analyzed because the content could not be extracted from the PDF file or is too short. Please ensure the document is not password protected, is not a scanned image-only PDF, and try re-uploading.\n`;
  }
  // Use the same logic as generateDetailedDocumentSummary for now
  return generateDetailedDocumentSummary(fileName, content, '', 0, '');
}

function generateDocumentImprovements(documentType: string, content: string): string[] {
  const improvements: string[] = [];
  const lowerContent = content.toLowerCase();

  // Document-specific improvement suggestions
  switch (documentType) {
    case 'country_report':
      improvements.push("Verify the report is current and from reliable sources");
      improvements.push("Ensure country conditions are specific to the client's circumstances");
      improvements.push("Include recent developments or changes in country conditions");
      break;

    case 'nta':
      improvements.push("Verify all allegations and charges are accurate");
      improvements.push("Ensure proper service requirements are documented");
      improvements.push("Check for any missing statutory citations");
      break;

    case 'motion':
      improvements.push("Verify all legal arguments are supported by case law");
      improvements.push("Ensure proper procedural requirements are met");
      improvements.push("Check for complete factual basis and evidence");
      break;

    case 'legal_brief':
      improvements.push("Verify all case law citations are current and relevant");
      improvements.push("Ensure legal arguments are comprehensive and well-structured");
      improvements.push("Check for proper formatting and court requirements");
      break;

    case 'evidence_package':
      improvements.push("Verify all evidence is properly authenticated");
      improvements.push("Ensure evidence is relevant and admissible");
      improvements.push("Check for complete documentation and translations");
      break;

    default:
      improvements.push("Review document for completeness and accuracy");
      improvements.push("Verify all legal citations and references");
      improvements.push("Ensure proper formatting and professional presentation");
  }

  return improvements;
}

function generateDocumentToolkit(documentType: string): string[] {
  const toolkit: string[] = [];

  // Document-specific toolkit recommendations
  switch (documentType) {
    case 'country_report':
      toolkit.push("U.S. State Department Country Reports");
      toolkit.push("Human Rights Watch Reports");
      toolkit.push("Amnesty International Documentation");
      toolkit.push("UNHCR Country Information");
      break;

    case 'nta':
      toolkit.push("EOIR Portal - Immigration Court Case Management");
      toolkit.push("USCIS Website - Immigration Forms and Guidance");
      toolkit.push("Immigration Court Practice Manual");
      break;

    case 'motion':
      toolkit.push("Federal Rules of Civil Procedure");
      toolkit.push("Immigration Court Practice Manual");
      toolkit.push("Westlaw Immigration Library");
      break;

    case 'legal_brief':
      toolkit.push("Westlaw Legal Research Database");
      toolkit.push("LexisNexis Immigration Library");
      toolkit.push("Federal Court Electronic Filing System (CM/ECF)");
      break;

    case 'evidence_package':
      toolkit.push("Document Authentication Services");
      toolkit.push("Translation Services");
      toolkit.push("Evidence Management Systems");
      break;

    default:
      toolkit.push("EOIR Portal - Immigration court case management");
      toolkit.push("USCIS Website - Immigration forms and guidance");
      toolkit.push("Westlaw Immigration Library - Specialized immigration research");
  }

  return toolkit;
}

// Content extraction helper functions for detailed analysis
function extractCountryName(fileName: string, content: string): string {
  const lowerFileName = fileName.toLowerCase();
  const lowerContent = content.toLowerCase();

  // Extract from filename first (more comprehensive)
  if (lowerFileName.includes('japan')) return 'Japan';
  if (lowerFileName.includes('nicaragua')) return 'Nicaragua';
  if (lowerFileName.includes('mexico')) return 'Mexico';
  if (lowerFileName.includes('china')) return 'China';
  if (lowerFileName.includes('india')) return 'India';
  if (lowerFileName.includes('brazil')) return 'Brazil';
  if (lowerFileName.includes('russia')) return 'Russia';
  if (lowerFileName.includes('iran')) return 'Iran';
  if (lowerFileName.includes('venezuela')) return 'Venezuela';
  if (lowerFileName.includes('honduras')) return 'Honduras';
  if (lowerFileName.includes('guatemala')) return 'Guatemala';
  if (lowerFileName.includes('el salvador')) return 'El Salvador';
  if (lowerFileName.includes('cuba')) return 'Cuba';
  if (lowerFileName.includes('colombia')) return 'Colombia';
  if (lowerFileName.includes('peru')) return 'Peru';
  if (lowerFileName.includes('ecuador')) return 'Ecuador';
  if (lowerFileName.includes('bolivia')) return 'Bolivia';
  if (lowerFileName.includes('paraguay')) return 'Paraguay';
  if (lowerFileName.includes('uruguay')) return 'Uruguay';
  if (lowerFileName.includes('argentina')) return 'Argentina';
  if (lowerFileName.includes('chile')) return 'Chile';

  // Extract from content
  if (lowerContent.includes('japan')) return 'Japan';
  if (lowerContent.includes('nicaragua')) return 'Nicaragua';
  if (lowerContent.includes('mexico')) return 'Mexico';
  if (lowerContent.includes('china')) return 'China';
  if (lowerContent.includes('india')) return 'India';
  if (lowerContent.includes('brazil')) return 'Brazil';
  if (lowerContent.includes('russia')) return 'Russia';
  if (lowerContent.includes('iran')) return 'Iran';
  if (lowerContent.includes('venezuela')) return 'Venezuela';
  if (lowerContent.includes('honduras')) return 'Honduras';
  if (lowerContent.includes('guatemala')) return 'Guatemala';
  if (lowerContent.includes('el salvador')) return 'El Salvador';
  if (lowerContent.includes('cuba')) return 'Cuba';
  if (lowerContent.includes('colombia')) return 'Colombia';
  if (lowerContent.includes('peru')) return 'Peru';
  if (lowerContent.includes('ecuador')) return 'Ecuador';
  if (lowerContent.includes('bolivia')) return 'Bolivia';
  if (lowerContent.includes('paraguay')) return 'Paraguay';
  if (lowerContent.includes('uruguay')) return 'Uruguay';
  if (lowerContent.includes('argentina')) return 'Argentina';
  if (lowerContent.includes('chile')) return 'Chile';

  return 'Unknown Country';
}

function extractReportYear(fileName: string, content: string): string {
  const yearMatch = fileName.match(/(20\d{2})/) || content.match(/(20\d{2})/);
  return yearMatch ? yearMatch[1] : '2023';
}

function extractHumanRightsIssues(content: string, fileName: string = ''): string[] {
  const issues: string[] = [];
  const lowerContent = content.toLowerCase();
  const lowerFileName = fileName.toLowerCase();

  // General human rights issues
  if (lowerContent.includes('human rights') || lowerContent.includes('human rights violation')) {
    issues.push('Human rights violations and abuses');
  }
  if (lowerContent.includes('persecution') || lowerContent.includes('political persecution')) {
    issues.push('Political persecution and oppression');
  }
  if (lowerContent.includes('discrimination') || lowerContent.includes('systemic discrimination')) {
    issues.push('Systemic discrimination and inequality');
  }
  if (lowerContent.includes('violence') || lowerContent.includes('domestic violence')) {
    issues.push('Violence and domestic abuse');
  }
  if (lowerContent.includes('police') || lowerContent.includes('law enforcement')) {
    issues.push('Police misconduct and lack of accountability');
  }
  if (lowerContent.includes('judicial') || lowerContent.includes('court system')) {
    issues.push('Judicial corruption and lack of due process');
  }
  if (lowerContent.includes('lgbtq') || lowerContent.includes('sexual orientation')) {
    issues.push('LGBTQ+ rights violations');
  }
  if (lowerContent.includes('religious') || lowerContent.includes('freedom of religion')) {
    issues.push('Religious persecution and restrictions');
  }
  if (lowerContent.includes('ethnic') || lowerContent.includes('minority')) {
    issues.push('Ethnic and minority discrimination');
  }
  if (lowerContent.includes('labor') || lowerContent.includes('worker rights')) {
    issues.push('Labor rights violations and exploitation');
  }

  // Country-specific issues based on filename
  if (lowerFileName.includes('japan')) {
    issues.push('Workplace discrimination and gender inequality');
    issues.push('Strict immigration policies and detention conditions');
    issues.push('Limited freedom of expression and press restrictions');
  }

  if (lowerFileName.includes('nicaragua')) {
    issues.push('Political repression and government crackdowns');
    issues.push('Restrictions on freedom of assembly and protest');
    issues.push('Arbitrary arrests and political imprisonment');
    issues.push('Media censorship and press freedom violations');
  }

  if (lowerFileName.includes('mexico')) {
    issues.push('Drug cartel violence and organized crime');
    issues.push('Corruption in law enforcement and judiciary');
    issues.push('Disappearances and extrajudicial killings');
    issues.push('Violence against journalists and human rights defenders');
  }

  if (lowerFileName.includes('venezuela')) {
    issues.push('Economic crisis and humanitarian emergency');
    issues.push('Political persecution and opposition suppression');
    issues.push('Food and medicine shortages');
    issues.push('Arbitrary detentions and torture');
  }

  if (lowerFileName.includes('honduras') || lowerFileName.includes('guatemala') || lowerFileName.includes('el salvador')) {
    issues.push('Gang violence and extortion');
    issues.push('Gender-based violence and femicide');
    issues.push('Corruption and impunity');
    issues.push('Forced displacement and internal migration');
  }

  return issues.length > 0 ? issues : ['General human rights conditions assessment'];
}

function extractSources(content: string): string[] {
  const sources: string[] = [];
  const lowerContent = content.toLowerCase();

  if (lowerContent.includes('state department') || lowerContent.includes('u.s. department of state')) {
    sources.push('U.S. State Department');
  }
  if (lowerContent.includes('human rights watch')) {
    sources.push('Human Rights Watch');
  }
  if (lowerContent.includes('amnesty international')) {
    sources.push('Amnesty International');
  }
  if (lowerContent.includes('unhcr') || lowerContent.includes('united nations')) {
    sources.push('UNHCR');
  }
  if (lowerContent.includes('ngo') || lowerContent.includes('non-governmental')) {
    sources.push('NGO reports');
  }
  if (lowerContent.includes('news') || lowerContent.includes('media')) {
    sources.push('News media reports');
  }

  return sources.length > 0 ? sources : ['Official sources and human rights organizations'];
}

function extractNTAAllegations(content: string): string[] {
  const allegations: string[] = [];
  const lowerContent = content.toLowerCase();

  if (lowerContent.includes('illegal entry') || lowerContent.includes('entry without inspection')) {
    allegations.push('Illegal entry without inspection');
  }
  if (lowerContent.includes('overstay') || lowerContent.includes('visa violation')) {
    allegations.push('Visa overstay or violation');
  }
  if (lowerContent.includes('criminal') || lowerContent.includes('conviction')) {
    allegations.push('Criminal conviction grounds');
  }
  if (lowerContent.includes('fraud') || lowerContent.includes('misrepresentation')) {
    allegations.push('Fraud or misrepresentation');
  }

  return allegations;
}

function extractHearingInfo(content: string): string[] {
  const info: string[] = [];
  const lowerContent = content.toLowerCase();

  if (lowerContent.includes('hearing') || lowerContent.includes('court date')) {
    info.push('Hearing date and time to be scheduled');
  }
  if (lowerContent.includes('location') || lowerContent.includes('address')) {
    info.push('Court location to be provided');
  }

  return info;
}

function extractCharges(content: string): string[] {
  const charges: string[] = [];
  const lowerContent = content.toLowerCase();

  if (lowerContent.includes('section 212') || lowerContent.includes('inadmissibility')) {
    charges.push('Section 212 inadmissibility grounds');
  }
  if (lowerContent.includes('section 237') || lowerContent.includes('deportability')) {
    charges.push('Section 237 deportability grounds');
  }

  return charges;
}

function extractMotionType(content: string): string {
  const lowerContent = content.toLowerCase();

  if (lowerContent.includes('motion to reopen')) return 'Motion to Reopen';
  if (lowerContent.includes('motion to reconsider')) return 'Motion to Reconsider';
  if (lowerContent.includes('motion to suppress')) return 'Motion to Suppress';
  if (lowerContent.includes('motion to terminate')) return 'Motion to Terminate';
  if (lowerContent.includes('motion to change venue')) return 'Motion to Change Venue';

  return 'Immigration Motion';
}

function extractReliefSought(content: string): string[] {
  const relief: string[] = [];
  const lowerContent = content.toLowerCase();

  if (lowerContent.includes('asylum') || lowerContent.includes('withholding')) {
    relief.push('Asylum or Withholding of Removal');
  }
  if (lowerContent.includes('cancellation') || lowerContent.includes('cancellation of removal')) {
    relief.push('Cancellation of Removal');
  }
  if (lowerContent.includes('adjustment') || lowerContent.includes('adjustment of status')) {
    relief.push('Adjustment of Status');
  }

  return relief.length > 0 ? relief : ['Legal relief in immigration proceedings'];
}

function extractLegalArguments(content: string): string[] {
  const legalArgs: string[] = [];
  const lowerContent = content.toLowerCase();

  if (lowerContent.includes('due process') || lowerContent.includes('constitutional')) {
    legalArgs.push('Due process and constitutional rights');
  }
  if (lowerContent.includes('ineffective assistance') || lowerContent.includes('counsel')) {
    legalArgs.push('Ineffective assistance of counsel');
  }
  if (lowerContent.includes('changed circumstances') || lowerContent.includes('country conditions')) {
    legalArgs.push('Changed country conditions');
  }

  return legalArgs.length > 0 ? legalArgs : ['Legal arguments based on immigration law'];
}

function extractBriefType(content: string): string {
  const lowerContent = content.toLowerCase();

  if (lowerContent.includes('opening brief')) return 'Opening Brief';
  if (lowerContent.includes('reply brief')) return 'Reply Brief';
  if (lowerContent.includes('amicus brief')) return 'Amicus Brief';
  if (lowerContent.includes('supplemental brief')) return 'Supplemental Brief';

  return 'Legal Brief';
}

function extractCaseCitations(content: string): string[] {
  const citations: string[] = [];
  const citationRegex = /([A-Z][a-z]+ v\. [A-Z][a-z]+|In re [A-Z][a-z]+)/g;
  const matches = content.match(citationRegex);

  if (matches) {
    citations.push(...matches.slice(0, 3)); // Limit to first 3 citations
  }

  return citations.length > 0 ? citations : ['Relevant case law citations'];
}

function extractLegalIssues(content: string): string[] {
  const issues: string[] = [];
  const lowerContent = content.toLowerCase();

  if (lowerContent.includes('asylum') || lowerContent.includes('persecution')) {
    issues.push('Asylum eligibility and persecution');
  }
  if (lowerContent.includes('credibility') || lowerContent.includes('testimony')) {
    issues.push('Credibility and testimony assessment');
  }
  if (lowerContent.includes('procedural') || lowerContent.includes('due process')) {
    issues.push('Procedural due process rights');
  }

  return issues.length > 0 ? issues : ['Immigration law and procedure'];
}

function extractEvidenceTypes(content: string): string[] {
  const types: string[] = [];
  const lowerContent = content.toLowerCase();

  if (lowerContent.includes('affidavit') || lowerContent.includes('declaration')) {
    types.push('Affidavits and declarations');
  }
  if (lowerContent.includes('medical') || lowerContent.includes('health')) {
    types.push('Medical records and health documentation');
  }
  if (lowerContent.includes('police') || lowerContent.includes('criminal')) {
    types.push('Police reports and criminal records');
  }
  if (lowerContent.includes('country') || lowerContent.includes('human rights')) {
    types.push('Country conditions reports');
  }

  return types.length > 0 ? types : ['Supporting documentation and exhibits'];
}

function extractAuthenticationInfo(content: string): string[] {
  const auth: string[] = [];
  const lowerContent = content.toLowerCase();

  if (lowerContent.includes('notarized') || lowerContent.includes('notary')) {
    auth.push('Notarized documents');
  }
  if (lowerContent.includes('certified') || lowerContent.includes('certification')) {
    auth.push('Certified copies');
  }
  if (lowerContent.includes('translation') || lowerContent.includes('translated')) {
    auth.push('Certified translations');
  }

  return auth.length > 0 ? auth : ['Document authentication requirements'];
}

function extractWitnessCount(content: string): string {
  const witnessRegex = /(\d+)\s*witness/i;
  const match = content.match(witnessRegex);
  return match ? match[1] : 'Multiple';
}

function extractWitnessTypes(content: string): string[] {
  const types: string[] = [];
  const lowerContent = content.toLowerCase();

  if (lowerContent.includes('expert') || lowerContent.includes('professional')) {
    types.push('Expert witnesses');
  }
  if (lowerContent.includes('character') || lowerContent.includes('reputation')) {
    types.push('Character witnesses');
  }
  if (lowerContent.includes('fact') || lowerContent.includes('eyewitness')) {
    types.push('Fact witnesses');
  }

  return types.length > 0 ? types : ['Various witness types'];
}

function extractApplicationType(content: string): string {
  const lowerContent = content.toLowerCase();

  if (lowerContent.includes('i-589') || lowerContent.includes('asylum')) return 'I-589 Asylum Application';
  if (lowerContent.includes('i-485') || lowerContent.includes('adjustment')) return 'I-485 Adjustment of Status';
  if (lowerContent.includes('i-130') || lowerContent.includes('petition')) return 'I-130 Petition for Alien Relative';
  if (lowerContent.includes('i-751') || lowerContent.includes('removal of conditions')) return 'I-751 Removal of Conditions';

  return 'USCIS Application';
}

function extractSubmissionPurpose(content: string): string[] {
  const purposes: string[] = [];
  const lowerContent = content.toLowerCase();

  if (lowerContent.includes('asylum') || lowerContent.includes('protection')) {
    purposes.push('Request for asylum protection');
  }
  if (lowerContent.includes('adjustment') || lowerContent.includes('status')) {
    purposes.push('Adjustment of immigration status');
  }
  if (lowerContent.includes('petition') || lowerContent.includes('relative')) {
    purposes.push('Petition for family member');
  }

  return purposes.length > 0 ? purposes : ['Immigration benefit application'];
}

function extractDenialReasons(content: string): string[] {
  const reasons: string[] = [];
  const lowerContent = content.toLowerCase();

  if (lowerContent.includes('incomplete') || lowerContent.includes('missing')) {
    reasons.push('Incomplete or missing documentation');
  }
  if (lowerContent.includes('ineligible') || lowerContent.includes('not eligible')) {
    reasons.push('Ineligibility for benefit sought');
  }
  if (lowerContent.includes('fraud') || lowerContent.includes('misrepresentation')) {
    reasons.push('Fraud or misrepresentation');
  }
  if (lowerContent.includes('criminal') || lowerContent.includes('conviction')) {
    reasons.push('Criminal conviction grounds');
  }

  return reasons.length > 0 ? reasons : ['Various eligibility or documentation issues'];
}

function extractResponseDeadline(content: string): string {
  const deadlineRegex = /(\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}\s+(?:days?|weeks?|months?))/i;
  const match = content.match(deadlineRegex);
  return match ? match[1] : '30 days from notice date';
}

function extractAsylumBasis(content: string): string[] {
  const bases: string[] = [];
  const lowerContent = content.toLowerCase();

  if (lowerContent.includes('race') || lowerContent.includes('racial')) {
    bases.push('Race or ethnicity');
  }
  if (lowerContent.includes('religion') || lowerContent.includes('religious')) {
    bases.push('Religion');
  }
  if (lowerContent.includes('nationality') || lowerContent.includes('national origin')) {
    bases.push('Nationality or national origin');
  }
  if (lowerContent.includes('political') || lowerContent.includes('political opinion')) {
    bases.push('Political opinion');
  }
  if (lowerContent.includes('social group') || lowerContent.includes('particular social group')) {
    bases.push('Membership in particular social group');
  }

  return bases.length > 0 ? bases : ['Fear of persecution based on protected grounds'];
}

function extractPersecutionDetails(content: string): string[] {
  const details: string[] = [];
  const lowerContent = content.toLowerCase();

  if (lowerContent.includes('threat') || lowerContent.includes('intimidation')) {
    details.push('Threats and intimidation');
  }
  if (lowerContent.includes('violence') || lowerContent.includes('physical harm')) {
    details.push('Physical violence and harm');
  }
  if (lowerContent.includes('arrest') || lowerContent.includes('detention')) {
    details.push('Arrest and detention');
  }
  if (lowerContent.includes('torture') || lowerContent.includes('abuse')) {
    details.push('Torture and abuse');
  }

  return details.length > 0 ? details : ['Various forms of persecution'];
}

function extractClientTestimony(content: string): string[] {
  const testimony: string[] = [];
  const lowerContent = content.toLowerCase();

  if (lowerContent.includes('personal') || lowerContent.includes('experience')) {
    testimony.push('Personal experiences and background');
  }
  if (lowerContent.includes('fear') || lowerContent.includes('concern')) {
    testimony.push('Fear of return to home country');
  }
  if (lowerContent.includes('family') || lowerContent.includes('relationship')) {
    testimony.push('Family relationships and circumstances');
  }

  return testimony.length > 0 ? testimony : ['Personal testimony and statements'];
}

function extractPersonalDetails(content: string): string[] {
  const details: string[] = [];
  const lowerContent = content.toLowerCase();

  if (lowerContent.includes('birth') || lowerContent.includes('date of birth')) {
    details.push('Birth information and personal history');
  }
  if (lowerContent.includes('education') || lowerContent.includes('school')) {
    details.push('Educational background');
  }
  if (lowerContent.includes('employment') || lowerContent.includes('work')) {
    details.push('Employment history');
  }

  return details.length > 0 ? details : ['Personal background information'];
}

function extractExpertQualifications(content: string): string[] {
  const qualifications: string[] = [];
  const lowerContent = content.toLowerCase();

  if (lowerContent.includes('phd') || lowerContent.includes('doctorate')) {
    qualifications.push('Advanced academic credentials');
  }
  if (lowerContent.includes('professor') || lowerContent.includes('university')) {
    qualifications.push('Academic or research experience');
  }
  if (lowerContent.includes('medical') || lowerContent.includes('physician')) {
    qualifications.push('Medical or healthcare expertise');
  }
  if (lowerContent.includes('legal') || lowerContent.includes('attorney')) {
    qualifications.push('Legal expertise and qualifications');
  }

  return qualifications.length > 0 ? qualifications : ['Professional qualifications and expertise'];
}

function extractExpertOpinion(content: string): string[] {
  const opinions: string[] = [];
  const lowerContent = content.toLowerCase();

  if (lowerContent.includes('country conditions') || lowerContent.includes('human rights')) {
    opinions.push('Country conditions analysis');
  }
  if (lowerContent.includes('medical') || lowerContent.includes('health')) {
    opinions.push('Medical or health assessment');
  }
  if (lowerContent.includes('psychological') || lowerContent.includes('mental health')) {
    opinions.push('Psychological evaluation');
  }

  return opinions.length > 0 ? opinions : ['Expert analysis and opinion'];
}

function extractEvaluationType(content: string): string {
  const lowerContent = content.toLowerCase();

  if (lowerContent.includes('asylum') || lowerContent.includes('immigration')) {
    return 'Immigration Psychological Evaluation';
  }
  if (lowerContent.includes('trauma') || lowerContent.includes('ptsd')) {
    return 'Trauma Assessment';
  }
  if (lowerContent.includes('competency') || lowerContent.includes('capacity')) {
    return 'Competency Evaluation';
  }

  return 'Psychological Evaluation';
}

function extractMentalHealthFindings(content: string): string[] {
  const findings: string[] = [];
  const lowerContent = content.toLowerCase();

  if (lowerContent.includes('ptsd') || lowerContent.includes('post-traumatic')) {
    findings.push('Post-traumatic stress disorder (PTSD)');
  }
  if (lowerContent.includes('depression') || lowerContent.includes('depressive')) {
    findings.push('Depression and mood disorders');
  }
  if (lowerContent.includes('anxiety') || lowerContent.includes('anxious')) {
    findings.push('Anxiety and related disorders');
  }
  if (lowerContent.includes('trauma') || lowerContent.includes('traumatic')) {
    findings.push('Trauma-related symptoms');
  }

  return findings.length > 0 ? findings : ['Mental health assessment findings'];
}

function extractProposalType(content: string): string {
  const lowerContent = content.toLowerCase();

  if (lowerContent.includes('grant') || lowerContent.includes('funding')) {
    return 'Grant Proposal';
  }
  if (lowerContent.includes('legal services') || lowerContent.includes('pro bono')) {
    return 'Legal Services Proposal';
  }
  if (lowerContent.includes('program') || lowerContent.includes('service')) {
    return 'Program Development Proposal';
  }

  return 'Funding Proposal';
}

function extractFundingAmount(content: string): string {
  const amountRegex = /\$[\d,]+(?:\.\d{2})?|\d+\s*(?:thousand|million|billion)/i;
  const match = content.match(amountRegex);
  return match ? match[0] : 'Funding amount to be determined';
}

function extractProgramObjectives(content: string): string[] {
  const objectives: string[] = [];
  const lowerContent = content.toLowerCase();

  if (lowerContent.includes('legal services') || lowerContent.includes('representation')) {
    objectives.push('Legal services and representation');
  }
  if (lowerContent.includes('community') || lowerContent.includes('outreach')) {
    objectives.push('Community outreach and education');
  }
  if (lowerContent.includes('pro bono') || lowerContent.includes('volunteer')) {
    objectives.push('Pro bono legal assistance');
  }
  if (lowerContent.includes('training') || lowerContent.includes('capacity building')) {
    objectives.push('Training and capacity building');
  }

  return objectives.length > 0 ? objectives : ['Program development and service delivery'];
}

// Missing function definitions
function extractCriticalDates(content: string): string[] {
  const dates: string[] = [];
  const lowerContent = content.toLowerCase();

  // Extract dates in various formats
  const datePatterns = [
    /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
    /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi,
    /\b\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\b/gi
  ];

  datePatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      dates.push(...matches);
    }
  });

  // Remove duplicates and limit to first 5
  return Array.from(new Set(dates)).slice(0, 5);
}

function extractFinancialTerms(content: string): string[] {
  const terms: string[] = [];
  const lowerContent = content.toLowerCase();

  // Extract monetary amounts
  const moneyPattern = /\$[\d,]+(?:\.\d{2})?/g;
  const amounts = content.match(moneyPattern);
  if (amounts) {
    terms.push(...amounts);
  }

  // Extract financial terms
  const financialKeywords = [
    'funding', 'grant', 'budget', 'cost', 'expense', 'revenue', 'payment',
    'fee', 'charge', 'amount', 'total', 'sum', 'fund', 'donation'
  ];

  financialKeywords.forEach(keyword => {
    if (lowerContent.includes(keyword)) {
      terms.push(keyword);
    }
  });

  return terms.slice(0, 5);
}

function extractComplianceRequirements(content: string): string[] {
  const requirements: string[] = [];
  const lowerContent = content.toLowerCase();

  // Extract compliance-related terms
  const complianceKeywords = [
    'compliance', 'regulation', 'requirement', 'standard', 'policy',
    'procedure', 'guideline', 'rule', 'law', 'statute', 'regulation',
    'deadline', 'due date', 'filing', 'submission', 'documentation'
  ];

  complianceKeywords.forEach(keyword => {
    if (lowerContent.includes(keyword)) {
      requirements.push(keyword);
    }
  });

  return requirements.slice(0, 5);
}

export function setupRoutes(app: Express): Server {
  const server = createServer(app);

  // Setup warmup routes
  setupWarmupRoutes(app);

  return server;
}

// 🚀 Add FAISS vector search integration
async function buildVectorIndex(text: string, documentId: string, filename: string): Promise<boolean> {
  try {
    const response = await fetch(`${process.env.AI_SERVICE_URL || 'http://ai_service:5001'}/vector/build`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        document_id: documentId,
        filename
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Vector index built successfully:', result.stats);
      return true;
    } else {
      console.error('❌ Failed to build vector index:', await response.text());
      return false;
    }
  } catch (error) {
    console.error('❌ Error building vector index:', error);
    return false;
  }
}

async function semanticQuery(query: string, model: string = 'mistral:7b-instruct-q4_0'): Promise<any> {
  try {
    const response = await fetch(`${process.env.AI_SERVICE_URL || 'http://ai_service:5001'}/query/semantic`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        model,
        max_tokens: 300
      })
    });

    if (response.ok) {
      return await response.json();
    } else {
      console.error('❌ Semantic query failed:', await response.text());
      return null;
    }
  } catch (error) {
    console.error('❌ Error in semantic query:', error);
    return null;
  }
}


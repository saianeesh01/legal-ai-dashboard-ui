import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Clock, FileText, Target, Calendar, DollarSign, Shield, Users, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';

interface UniversalExtractionData {
  doc_type: string;
  meta: {
    title: string | null;
    jurisdiction_or_body: string | null;
    date_iso: string | null;
    page_count: number;
  };
  sections: any;
  processing_time_ms: number;
  confidence_score: number;
}

interface EnhancedUniversalAnalysisProps {
  universalExtraction: UniversalExtractionData | null;
  className?: string;
}

const getDocumentTypeIcon = (docType: string) => {
  switch (docType) {
    case 'court_opinion_or_order':
    case 'complaint_or_docket':
      return <FileText className="h-4 w-4" />;
    case 'government_form':
      return <FileText className="h-4 w-4" />;
    case 'grant_notice_or_rfa':
    case 'proposal_or_whitepaper':
      return <Target className="h-4 w-4" />;
    case 'meeting_minutes':
      return <Users className="h-4 w-4" />;
    case 'procurement_sow_or_contract':
      return <DollarSign className="h-4 w-4" />;
    case 'audit_or_investigation_report':
      return <Shield className="h-4 w-4" />;
    case 'federal_report_to_congress':
    case 'country_or_policy_report':
      return <TrendingUp className="h-4 w-4" />;
    case 'academic_program_or_clinic_brochure':
      return <Lightbulb className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

const getDocumentTypeLabel = (docType: string) => {
  const labels: { [key: string]: string } = {
    'court_opinion_or_order': 'Court Opinion/Order',
    'complaint_or_docket': 'Complaint/Docket',
    'government_form': 'Government Form',
    'council_or_rfp': 'Council/RFP',
    'grant_notice_or_rfa': 'Grant Notice/RFA',
    'meeting_minutes': 'Meeting Minutes',
    'procurement_sow_or_contract': 'Procurement/SOW/Contract',
    'audit_or_investigation_report': 'Audit/Investigation Report',
    'federal_report_to_congress': 'Federal Report to Congress',
    'country_or_policy_report': 'Country/Policy Report',
    'academic_program_or_clinic_brochure': 'Academic Program/Clinic Brochure',
    'proposal_or_whitepaper': 'Proposal/White Paper',
    'other_legal': 'Other Legal Document'
  };
  return labels[docType] || docType;
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Not specified';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
};

const formatConfidence = (confidence: number) => {
  const percentage = Math.round(confidence * 100);
  if (percentage >= 80) return { label: 'High', color: 'bg-green-100 text-green-800' };
  if (percentage >= 60) return { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' };
  return { label: 'Low', color: 'bg-red-100 text-red-800' };
};

const renderSectionData = (sectionData: any, sectionName: string) => {
  if (!sectionData || (Array.isArray(sectionData) && sectionData.length === 0)) {
    return <p className="text-gray-500 italic">No data available</p>;
  }

  if (Array.isArray(sectionData)) {
    return (
      <ul className="space-y-2">
        {sectionData.map((item, index) => (
          <li key={index} className="flex items-start space-x-2">
            <span className="text-blue-600 mt-1">•</span>
            <div className="flex-1">
              {typeof item === 'string' ? (
                <span className="text-sm">{item}</span>
              ) : (
                <div className="space-y-1">
                  {Object.entries(item).map(([key, value]) => (
                    <div key={key} className="text-sm">
                      <span className="font-medium text-gray-700">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</span>{' '}
                      <span className="text-gray-600">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (typeof sectionData === 'object') {
    return (
      <div className="space-y-2">
        {Object.entries(sectionData).map(([key, value]) => (
          <div key={key} className="text-sm">
            <span className="font-medium text-gray-700">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</span>{' '}
            <span className="text-gray-600">
              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return <span className="text-sm text-gray-600">{String(sectionData)}</span>;
};

export const EnhancedUniversalAnalysis: React.FC<EnhancedUniversalAnalysisProps> = ({
  universalExtraction,
  className = ''
}) => {
  if (!universalExtraction) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Enhanced Document Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No enhanced analysis data available</p>
        </CardContent>
      </Card>
    );
  }

  const confidenceInfo = formatConfidence(universalExtraction.confidence_score);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Document Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {getDocumentTypeIcon(universalExtraction.doc_type)}
            <span>Document Analysis Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Document Type</label>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">{getDocumentTypeLabel(universalExtraction.doc_type)}</Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Confidence</label>
              <Badge className={confidenceInfo.color}>{confidenceInfo.label} ({Math.round(universalExtraction.confidence_score * 100)}%)</Badge>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Processing Time</label>
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>{universalExtraction.processing_time_ms}ms</span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Title</label>
              <p className="text-sm text-gray-600">{universalExtraction.meta.title || 'Not specified'}</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Jurisdiction/Body</label>
              <p className="text-sm text-gray-600">{universalExtraction.meta.jurisdiction_or_body || 'Not specified'}</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Date</label>
              <p className="text-sm text-gray-600">{formatDate(universalExtraction.meta.date_iso)}</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Pages</label>
              <p className="text-sm text-gray-600">{universalExtraction.meta.page_count} pages</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Sections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Document Sections & Key Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(universalExtraction.sections).map(([sectionName, sectionData]) => (
            <div key={sectionName} className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                {sectionName === 'key_dates' && <Calendar className="h-4 w-4" />}
                {sectionName === 'financial_terms' && <DollarSign className="h-4 w-4" />}
                {sectionName === 'compliance_requirements' && <Shield className="h-4 w-4" />}
                {sectionName === 'parties_and_roles' && <Users className="h-4 w-4" />}
                {sectionName === 'statistics_or_figures' && <TrendingUp className="h-4 w-4" />}
                {sectionName === 'warnings_or_instructions' && <AlertTriangle className="h-4 w-4" />}
                {sectionName === 'suggestions' && <Lightbulb className="h-4 w-4" />}
                <span>{sectionName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
              </h4>
              <div className="pl-6">
                {renderSectionData(sectionData, sectionName)}
              </div>
              <Separator />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

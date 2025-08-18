import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    FileText,
    Calendar,
    Users,
    Gavel,
    Target,
    TrendingUp,
    Shield,
    AlertTriangle,
    CheckCircle,
    Clock,
    MapPin,
    Building,
    BookOpen,
    FileCheck,
    DollarSign,
    AlertCircle,
    Info,
    ExternalLink,
    ChevronDown,
    ChevronUp
} from "lucide-react";
import { useState } from 'react';

// Base interface for all extracted items
interface ExtractedItem {
    value: string;
    page: number;
    evidence: string;
    confidence: number;
}

// Specific item types
interface ExtractedDate extends ExtractedItem {
    date_iso: string;
    label: 'filing' | 'hearing' | 'order' | 'decision' | 'announcement' | 'other';
}

interface ExtractedParty extends ExtractedItem {
    name: string;
    role?: 'plaintiff' | 'defendant' | 'petitioner' | 'respondent' | 'agency' | 'official';
}

interface ExtractedStatute extends ExtractedItem {
    type: 'statute' | 'case' | 'regulation' | 'notice';
    citation: string;
}

interface ExtractedStatistic {
    metric: string;
    value: number;
    unit: 'percent' | 'count' | 'per_day' | 'per_month' | 'years' | 'other';
    context: string;
    page: number;
    evidence: string;
    confidence: number;
}

interface ExtractedFunding extends ExtractedItem {
    amount: number | null;
    currency: 'USD' | null;
    context: string;
}

interface ExtractedRequirement extends ExtractedItem {
    item: string;
}

interface ExtractedFinding extends ExtractedItem {
    statement: string;
}

interface ExtractedTheme extends ExtractedItem {
    topic: string;
}

interface ExtractedField extends ExtractedItem {
    field: string;
}

interface ExtractedWarning extends ExtractedItem {
    text: string;
}

// Document type union
type DocumentType =
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

// Universal extraction result interface
interface UniversalExtractionResult {
    doc_type: DocumentType;
    meta: {
        title?: string | null;
        jurisdiction_or_body?: string | null;
        date_iso?: string | null;
        page_count?: number;
    };
    sections: any; // Flexible sections object
}

interface UniversalAnalysisProps {
    extractionResult: UniversalExtractionResult;
    className?: string;
}

// Collapsible section component
const CollapsibleSection = ({
    title,
    icon: Icon,
    children,
    defaultExpanded = true,
    className = ""
}: {
    title: string;
    icon: any;
    children: React.ReactNode;
    defaultExpanded?: boolean;
    className?: string;
}) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    return (
        <Card className={`bg-gradient-to-br from-slate-900 to-gray-900 border-slate-500/20 text-white shadow-elegant animate-fade-in ${className}`}>
            <CardHeader
                className="cursor-pointer hover:bg-slate-800/30 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <CardTitle className="flex items-center justify-between text-base">
                    <div className="flex items-center space-x-2">
                        <Icon className="h-4 w-4 text-blue-300" />
                        <span className="text-slate-100">{title}</span>
                    </div>
                    {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-slate-400" />
                    ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                </CardTitle>
            </CardHeader>
            {isExpanded && (
                <CardContent>
                    {children}
                </CardContent>
            )}
        </Card>
    );
};

// Evidence display component
const EvidenceDisplay = ({ evidence, page, confidence }: { evidence: string; page: number; confidence: number }) => (
    <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/30">
        <div className="flex items-start justify-between mb-2">
            <Badge variant="outline" className="bg-blue-500/20 border-blue-400 text-blue-200 text-xs">
                Page {page}
            </Badge>
            <Badge variant="outline" className="bg-green-500/20 border-green-400 text-green-200 text-xs">
                {Math.round(confidence * 100)}% confidence
            </Badge>
        </div>
        <p className="text-sm text-slate-200 leading-relaxed italic">
            "{evidence}"
        </p>
    </div>
);

// Date display component
const DateDisplay = ({ date_iso, label, evidence, page, confidence }: ExtractedDate) => (
    <div className="flex items-start space-x-3 p-3 rounded-md bg-orange-500/20 border border-orange-500/30">
        <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
        <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
                <span className="text-sm font-medium text-orange-200">{date_iso}</span>
                <Badge variant="outline" className="bg-orange-500/20 border-orange-400 text-orange-200 text-xs">
                    {label}
                </Badge>
            </div>
            <EvidenceDisplay evidence={evidence} page={page} confidence={confidence} />
        </div>
    </div>
);

// Party display component
const PartyDisplay = ({ party }: { party: ExtractedParty }) => (
    <div className="flex items-start space-x-3 p-3 rounded-md bg-blue-500/20 border border-blue-500/30">
        <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
        <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
                <span className="text-sm font-medium text-blue-200">{party.name}</span>
                {party.role && (
                    <Badge variant="outline" className="bg-blue-500/20 border-blue-400 text-blue-200 text-xs">
                        {party.role}
                    </Badge>
                )}
            </div>
            <EvidenceDisplay evidence={party.evidence} page={party.page} confidence={party.confidence} />
        </div>
    </div>
);

// Main UniversalAnalysis component
const UniversalAnalysis: React.FC<UniversalAnalysisProps> = ({ extractionResult, className = "" }) => {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['meta']));

    const toggleSection = (sectionName: string) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(sectionName)) {
            newExpanded.delete(sectionName);
        } else {
            newExpanded.add(sectionName);
        }
        setExpandedSections(newExpanded);
    };

    const getDocumentTypeIcon = (docType: DocumentType) => {
        switch (docType) {
            case 'court_opinion_or_order': return Gavel;
            case 'complaint_or_docket': return FileText;
            case 'government_form': return FileCheck;
            case 'council_or_rfp': return Building;
            case 'grant_notice_or_rfa': return DollarSign;
            case 'meeting_minutes': return Clock;
            case 'procurement_sow_or_contract': return Shield;
            case 'audit_or_investigation_report': return AlertTriangle;
            case 'federal_report_to_congress': return BookOpen;
            case 'country_or_policy_report': return MapPin;
            case 'academic_program_or_clinic_brochure': return Users;
            case 'proposal_or_whitepaper': return Target;
            case 'other_legal': return FileText;
            default: return FileText;
        }
    };

    const getDocumentTypeColor = (docType: DocumentType) => {
        switch (docType) {
            case 'court_opinion_or_order': return 'from-purple-900 to-indigo-900';
            case 'complaint_or_docket': return 'from-red-900 to-rose-900';
            case 'government_form': return 'from-orange-900 to-amber-900';
            case 'council_or_rfp': return 'from-blue-900 to-cyan-900';
            case 'grant_notice_or_rfa': return 'from-green-900 to-emerald-900';
            case 'meeting_minutes': return 'from-slate-900 to-gray-900';
            case 'procurement_sow_or_contract': return 'from-indigo-900 to-purple-900';
            case 'audit_or_investigation_report': return 'from-red-900 to-orange-900';
            case 'federal_report_to_congress': return 'from-blue-900 to-indigo-900';
            case 'country_or_policy_report': return 'from-teal-900 to-cyan-900';
            case 'academic_program_or_clinic_brochure': return 'from-violet-900 to-purple-900';
            case 'proposal_or_whitepaper': return 'from-emerald-900 to-teal-900';
            case 'other_legal': return 'from-gray-900 to-slate-900';
            default: return 'from-slate-900 to-gray-900';
        }
    };

    const renderSectionContent = () => {
        const sections = extractionResult.sections;
        const docType = extractionResult.doc_type;

        switch (docType) {
            case 'court_opinion_or_order':
                return (
                    <div className="space-y-6">
                        {/* Caption */}
                        {sections.caption && (
                            <CollapsibleSection title="Case Caption" icon={Gavel} defaultExpanded={true}>
                                <div className="space-y-4">
                                    {sections.caption.court && (
                                        <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
                                            <h4 className="font-medium text-slate-200 mb-2">Court</h4>
                                            <p className="text-slate-300">{sections.caption.court}</p>
                                        </div>
                                    )}
                                    {sections.caption.case_no && (
                                        <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
                                            <h4 className="font-medium text-slate-200 mb-2">Case Number</h4>
                                            <p className="text-slate-300">{sections.caption.case_no}</p>
                                        </div>
                                    )}
                                    {/* Parties */}
                                    {sections.caption.parties && (
                                        <div className="space-y-4">
                                            {sections.caption.parties.plaintiffs && sections.caption.parties.plaintiffs.length > 0 && (
                                                <div>
                                                    <h4 className="font-medium text-slate-200 mb-2">Plaintiffs</h4>
                                                    <div className="space-y-2">
                                                        {sections.caption.parties.plaintiffs.map((party: ExtractedParty, index: number) => (
                                                            <PartyDisplay key={index} party={party} />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {sections.caption.parties.defendants && sections.caption.parties.defendants.length > 0 && (
                                                <div>
                                                    <h4 className="font-medium text-slate-200 mb-2">Defendants</h4>
                                                    <div className="space-y-2">
                                                        {sections.caption.parties.defendants.map((party: ExtractedParty, index: number) => (
                                                            <PartyDisplay key={index} party={party} />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </CollapsibleSection>
                        )}

                        {/* Key Dates */}
                        {sections.key_dates && sections.key_dates.length > 0 && (
                            <CollapsibleSection title="Key Dates" icon={Calendar} defaultExpanded={false}>
                                <div className="space-y-3">
                                    {sections.key_dates.map((date: ExtractedDate, index: number) => (
                                        <DateDisplay key={index} {...date} />
                                    ))}
                                </div>
                            </CollapsibleSection>
                        )}

                        {/* Holdings/Disposition */}
                        {sections.holding_or_disposition && sections.holding_or_disposition.length > 0 && (
                            <CollapsibleSection title="Holdings & Disposition" icon={Target} defaultExpanded={false}>
                                <div className="space-y-3">
                                    {sections.holding_or_disposition.map((item: ExtractedItem, index: number) => (
                                        <div key={index} className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/30">
                                            <p className="text-slate-200 mb-2">{item.value}</p>
                                            <EvidenceDisplay evidence={item.evidence} page={item.page} confidence={item.confidence} />
                                        </div>
                                    ))}
                                </div>
                            </CollapsibleSection>
                        )}

                        {/* Statistics */}
                        {sections.statistics_or_figures && sections.statistics_or_figures.length > 0 && (
                            <CollapsibleSection title="Statistics & Figures" icon={TrendingUp} defaultExpanded={false}>
                                <div className="space-y-3">
                                    {sections.statistics_or_figures.map((stat: ExtractedStatistic, index: number) => (
                                        <div key={index} className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/30">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-slate-200">{stat.metric}</span>
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-lg font-bold text-green-400">{stat.value}</span>
                                                    <Badge variant="outline" className="bg-green-500/20 border-green-400 text-green-200 text-xs">
                                                        {stat.unit}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <p className="text-slate-300 text-sm mb-2">{stat.context}</p>
                                            <EvidenceDisplay evidence={stat.evidence} page={stat.page} confidence={stat.confidence} />
                                        </div>
                                    ))}
                                </div>
                            </CollapsibleSection>
                        )}
                    </div>
                );

            case 'government_form':
                return (
                    <div className="space-y-6">
                        {/* Form Information */}
                        <CollapsibleSection title="Form Information" icon={FileCheck} defaultExpanded={true}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {sections.form_id && (
                                    <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
                                        <h4 className="font-medium text-slate-200 mb-2">Form ID</h4>
                                        <p className="text-slate-300">{sections.form_id}</p>
                                    </div>
                                )}
                                {sections.agency && (
                                    <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
                                        <h4 className="font-medium text-slate-200 mb-2">Agency</h4>
                                        <p className="text-slate-300">{sections.agency}</p>
                                    </div>
                                )}
                            </div>
                            {sections.edition_or_omb && (
                                <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30 mt-4">
                                    <h4 className="font-medium text-slate-200 mb-2">Edition/OMB</h4>
                                    <p className="text-slate-300">{sections.edition_or_omb}</p>
                                </div>
                            )}
                        </CollapsibleSection>

                        {/* Named Fields */}
                        {sections.named_fields && sections.named_fields.length > 0 && (
                            <CollapsibleSection title="Named Fields" icon={FileText} defaultExpanded={false}>
                                <div className="space-y-3">
                                    {sections.named_fields.map((field: ExtractedField, index: number) => (
                                        <div key={index} className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/30">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-slate-400">Field:</span>
                                                <span className="text-slate-200">{field.field}</span>
                                            </div>
                                            <p className="text-slate-300 mb-2">{field.value}</p>
                                            <EvidenceDisplay evidence={field.evidence} page={field.page} confidence={field.confidence} />
                                        </div>
                                    ))}
                                </div>
                            </CollapsibleSection>
                        )}

                        {/* Warnings & Instructions */}
                        {sections.warnings_or_instructions && sections.warnings_or_instructions.length > 0 && (
                            <CollapsibleSection title="Warnings & Instructions" icon={AlertTriangle} defaultExpanded={true}>
                                <div className="space-y-3">
                                    {sections.warnings_or_instructions.map((warning: ExtractedWarning, index: number) => (
                                        <div key={index} className="bg-red-500/20 rounded-lg p-3 border border-red-500/30">
                                            <p className="text-red-200 mb-2">{warning.text}</p>
                                            <EvidenceDisplay evidence={warning.evidence} page={warning.page} confidence={warning.confidence} />
                                        </div>
                                    ))}
                                </div>
                            </CollapsibleSection>
                        )}
                    </div>
                );

            case 'country_or_policy_report':
                return (
                    <div className="space-y-6">
                        {/* Scope and Year */}
                        {sections.scope_and_year && (
                            <CollapsibleSection title="Scope & Year" icon={MapPin} defaultExpanded={true}>
                                <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
                                    <p className="text-slate-300">{sections.scope_and_year}</p>
                                </div>
                            </CollapsibleSection>
                        )}

                        {/* Themes */}
                        {sections.themes && sections.themes.length > 0 && (
                            <CollapsibleSection title="Themes" icon={Target} defaultExpanded={false}>
                                <div className="space-y-3">
                                    {sections.themes.map((theme: ExtractedTheme, index: number) => (
                                        <div key={index} className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/30">
                                            <p className="text-slate-200 mb-2">{theme.topic}</p>
                                            <EvidenceDisplay evidence={theme.evidence} page={theme.page} confidence={theme.confidence} />
                                        </div>
                                    ))}
                                </div>
                            </CollapsibleSection>
                        )}

                        {/* Findings */}
                        {sections.findings && sections.findings.length > 0 && (
                            <CollapsibleSection title="Findings" icon={CheckCircle} defaultExpanded={false}>
                                <div className="space-y-3">
                                    {sections.findings.map((finding: ExtractedFinding, index: number) => (
                                        <div key={index} className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/30">
                                            <p className="text-slate-200 mb-2">{finding.statement}</p>
                                            <EvidenceDisplay evidence={finding.evidence} page={finding.page} confidence={finding.confidence} />
                                        </div>
                                    ))}
                                </div>
                            </CollapsibleSection>
                        )}

                        {/* Statistics */}
                        {sections.statistics && sections.statistics.length > 0 && (
                            <CollapsibleSection title="Statistics" icon={TrendingUp} defaultExpanded={false}>
                                <div className="space-y-3">
                                    {sections.statistics.map((stat: ExtractedStatistic, index: number) => (
                                        <div key={index} className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/30">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-slate-200">{stat.metric}</span>
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-lg font-bold text-green-400">{stat.value}</span>
                                                    <Badge variant="outline" className="bg-green-500/20 border-green-400 text-green-200 text-xs">
                                                        {stat.unit}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <p className="text-slate-300 text-sm mb-2">{stat.context}</p>
                                            <EvidenceDisplay evidence={stat.evidence} page={stat.page} confidence={stat.confidence} />
                                        </div>
                                    ))}
                                </div>
                            </CollapsibleSection>
                        )}
                    </div>
                );

            default:
                // Generic fallback for other document types
                return (
                    <div className="space-y-6">
                        <CollapsibleSection title="Document Content" icon={FileText} defaultExpanded={true}>
                            <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
                                <p className="text-slate-300">
                                    This document type ({docType}) is supported but requires specific rendering logic.
                                    The extracted data is available in the sections object.
                                </p>
                                <div className="mt-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => console.log('Sections:', sections)}
                                        className="text-slate-400 border-slate-600 hover:bg-slate-700"
                                    >
                                        <Info className="h-3 w-3 mr-1" />
                                        View Raw Data
                                    </Button>
                                </div>
                            </div>
                        </CollapsibleSection>
                    </div>
                );
        }
    };

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Document Header */}
            <div className={`bg-gradient-to-br ${getDocumentTypeColor(extractionResult.doc_type)} text-white shadow-elegant animate-fade-in rounded-lg p-6`}>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-2">
                        {React.createElement(getDocumentTypeIcon(extractionResult.doc_type), {
                            className: "h-5 w-5 text-blue-300"
                        })}
                        <span className="text-blue-100 text-lg font-semibold">
                            {extractionResult.doc_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        </span>
                    </div>
                    <Badge variant="outline" className="bg-blue-500/20 border-blue-400 text-blue-200">
                        Universal Analysis
                    </Badge>
                </div>
                <p className="text-blue-200 mb-6">
                    AI-powered structured extraction of legal facts, dates, parties, and key information
                </p>
            </div>

            {/* Metadata */}
            <CollapsibleSection title="Document Metadata" icon={Info} defaultExpanded={true}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {extractionResult.meta.title && (
                        <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
                            <h4 className="font-medium text-slate-200 mb-2">Title</h4>
                            <p className="text-slate-300">{extractionResult.meta.title}</p>
                        </div>
                    )}
                    {extractionResult.meta.jurisdiction_or_body && (
                        <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
                            <h4 className="font-medium text-slate-200 mb-2">Jurisdiction/Body</h4>
                            <p className="text-slate-300">{extractionResult.meta.jurisdiction_or_body}</p>
                        </div>
                    )}
                    {extractionResult.meta.date_iso && (
                        <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
                            <h4 className="font-medium text-slate-200 mb-2">Date</h4>
                            <p className="text-slate-300">{extractionResult.meta.date_iso}</p>
                        </div>
                    )}
                    {extractionResult.meta.page_count && (
                        <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
                            <h4 className="font-medium text-slate-200 mb-2">Page Count</h4>
                            <p className="text-slate-300">{extractionResult.meta.page_count}</p>
                        </div>
                    )}
                </div>
            </CollapsibleSection>

            {/* Document-Specific Content */}
            {renderSectionContent()}

            {/* Footer */}
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600/30">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Info className="h-4 w-4 text-slate-400" />
                        <span className="text-sm text-slate-400">
                            Analysis powered by Universal Legal Document Extractor
                        </span>
                    </div>
                    <Button variant="outline" size="sm" className="text-slate-400 border-slate-600 hover:bg-slate-700">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Export Results
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default UniversalAnalysis;

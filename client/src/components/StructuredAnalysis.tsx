import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    CheckCircle,
    AlertTriangle,
    XCircle,
    FileText,
    Target,
    Lightbulb,
    Clock,
    DollarSign,
    Shield
} from "lucide-react";

interface StructuredAnalysisProps {
    analysis: any;
}

const StructuredAnalysis: React.FC<StructuredAnalysisProps> = ({ analysis }) => {
    // Parse the summary to extract structured information
    const parseAnalysis = (summary: string) => {
        const sections = {
            summary: '',
            positiveDevelopments: [] as string[],
            ongoingConcerns: [] as string[],
            urgentIssues: [] as string[],
            inconsistencies: [] as string[],
            missingInformation: [] as string[],
            suggestedActions: [] as string[]
        };

        // Split the summary into lines
        const lines = summary.split('\n').filter(line => line.trim());

        let currentSection = 'summary';
        let summaryText = '';

        for (const line of lines) {
            const trimmedLine = line.trim();

            // Check for new streamlined section headers with emojis
            if (trimmedLine.includes('🟩 Positive Developments:')) {
                currentSection = 'positiveDevelopments';
                continue;
            }

            if (trimmedLine.includes('🟨 Ongoing Concerns:')) {
                currentSection = 'ongoingConcerns';
                continue;
            }

            if (trimmedLine.includes('🟥 Urgent Issues:')) {
                currentSection = 'urgentIssues';
                continue;
            }

            if (trimmedLine.includes('Inconsistencies:')) {
                currentSection = 'inconsistencies';
                continue;
            }

            if (trimmedLine.includes('Missing Information:')) {
                currentSection = 'missingInformation';
                continue;
            }

            if (trimmedLine.includes('Suggested Action Items:')) {
                currentSection = 'suggestedActions';
                continue;
            }

            // Process content based on current section
            if (currentSection === 'summary') {
                if (!trimmedLine.startsWith('•') && !trimmedLine.startsWith('-') && !trimmedLine.startsWith('🟩') && !trimmedLine.startsWith('🟨') && !trimmedLine.startsWith('🟥')) {
                    summaryText += trimmedLine + ' ';
                }
            } else if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-')) {
                const content = trimmedLine.replace(/^[•\-]\s*/, '').trim();
                if (content) {
                    if (currentSection === 'positiveDevelopments') {
                        sections.positiveDevelopments.push(content);
                    } else if (currentSection === 'ongoingConcerns') {
                        sections.ongoingConcerns.push(content);
                    } else if (currentSection === 'urgentIssues') {
                        sections.urgentIssues.push(content);
                    } else if (currentSection === 'inconsistencies') {
                        sections.inconsistencies.push(content);
                    } else if (currentSection === 'missingInformation') {
                        sections.missingInformation.push(content);
                    } else if (currentSection === 'suggestedActions') {
                        sections.suggestedActions.push(content);
                    }
                }
            }
        }

        sections.summary = summaryText.trim();
        return sections;
    };

    const parsedAnalysis = parseAnalysis(analysis.summary || '');

    return (
        <div className="space-y-6">
            {/* Main Summary */}
            <Card className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center text-white">
                        <FileText className="h-5 w-5 mr-2 text-blue-300" />
                        Document Summary
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <p className="text-blue-200 leading-relaxed">
                            {parsedAnalysis.summary || analysis.summary}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Color-Coded Analysis Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Positive Developments - Green */}
                {parsedAnalysis.positiveDevelopments.length > 0 && (
                    <Card className="bg-green-500/10 backdrop-blur-lg border border-green-500/30 shadow-2xl">
                        <CardHeader>
                            <CardTitle className="flex items-center text-green-300">
                                <CheckCircle className="h-5 w-5 mr-2" />
                                🟩 Positive Developments
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {parsedAnalysis.positiveDevelopments.map((development, index) => (
                                    <div key={index} className="flex items-start space-x-3 p-3 bg-green-500/20 rounded-lg border border-green-500/30">
                                        <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                                        <span className="text-green-200 text-sm">{development}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Ongoing Concerns - Yellow */}
                {parsedAnalysis.ongoingConcerns.length > 0 && (
                    <Card className="bg-yellow-500/10 backdrop-blur-lg border border-yellow-500/30 shadow-2xl">
                        <CardHeader>
                            <CardTitle className="flex items-center text-yellow-300">
                                <AlertTriangle className="h-5 w-5 mr-2" />
                                🟨 Ongoing Concerns
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {parsedAnalysis.ongoingConcerns.map((concern, index) => (
                                    <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                                        <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                                        <span className="text-yellow-200 text-sm">{concern}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Urgent Issues - Red */}
                {parsedAnalysis.urgentIssues.length > 0 && (
                    <Card className="bg-red-500/10 backdrop-blur-lg border border-red-500/30 shadow-2xl lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center text-red-300">
                                <XCircle className="h-5 w-5 mr-2" />
                                🟥 Urgent Issues
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {parsedAnalysis.urgentIssues.map((issue, index) => (
                                    <div key={index} className="flex items-start space-x-3 p-3 bg-red-500/20 rounded-lg border border-red-500/30">
                                        <XCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                                        <span className="text-red-200 text-sm">{issue}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Inconsistencies */}
                {parsedAnalysis.inconsistencies.length > 0 && (
                    <Card className="bg-orange-500/10 backdrop-blur-lg border border-orange-500/30 shadow-2xl">
                        <CardHeader>
                            <CardTitle className="flex items-center text-orange-300">
                                <AlertTriangle className="h-5 w-5 mr-2" />
                                Inconsistencies
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {parsedAnalysis.inconsistencies.map((inconsistency, index) => (
                                    <div key={index} className="flex items-start space-x-3 p-3 bg-orange-500/20 rounded-lg border border-orange-500/30">
                                        <AlertTriangle className="h-4 w-4 text-orange-400 mt-0.5 flex-shrink-0" />
                                        <span className="text-orange-200 text-sm">{inconsistency}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Missing Information */}
                {parsedAnalysis.missingInformation.length > 0 && (
                    <Card className="bg-blue-500/10 backdrop-blur-lg border border-blue-500/30 shadow-2xl">
                        <CardHeader>
                            <CardTitle className="flex items-center text-blue-300">
                                <FileText className="h-5 w-5 mr-2" />
                                Missing Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {parsedAnalysis.missingInformation.map((info, index) => (
                                    <div key={index} className="flex items-start space-x-3 p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
                                        <FileText className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                        <span className="text-blue-200 text-sm">{info}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Suggested Action Items */}
                {parsedAnalysis.suggestedActions.length > 0 && (
                    <Card className="bg-purple-500/10 backdrop-blur-lg border border-purple-500/30 shadow-2xl lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center text-purple-300">
                                <Lightbulb className="h-5 w-5 mr-2" />
                                Suggested Action Items
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {parsedAnalysis.suggestedActions.map((action, index) => (
                                    <div key={index} className="flex items-start space-x-3 p-3 bg-purple-500/20 rounded-lg border border-purple-500/30">
                                        <Lightbulb className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                                        <span className="text-purple-200 text-sm">{action}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Critical Dates */}
                {analysis.criticalDates && analysis.criticalDates.length > 0 && (
                    <Card className="bg-orange-500/10 backdrop-blur-lg border border-orange-500/30 shadow-2xl">
                        <CardHeader>
                            <CardTitle className="flex items-center text-orange-300">
                                <Clock className="h-5 w-5 mr-2" />
                                Critical Dates
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {analysis.criticalDates.map((date: string, index: number) => (
                                    <div key={index} className="flex items-center space-x-3 p-3 bg-orange-500/20 rounded-lg border border-orange-500/30">
                                        <div className="w-2 h-2 bg-orange-400 rounded-full flex-shrink-0"></div>
                                        <span className="text-orange-200 text-sm font-medium">{date}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Financial Terms */}
                {analysis.financialTerms && analysis.financialTerms.length > 0 && (
                    <Card className="bg-emerald-500/10 backdrop-blur-lg border border-emerald-500/30 shadow-2xl">
                        <CardHeader>
                            <CardTitle className="flex items-center text-emerald-300">
                                <DollarSign className="h-5 w-5 mr-2" />
                                Financial Terms
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {analysis.financialTerms.map((term: string, index: number) => (
                                    <div key={index} className="flex items-center space-x-3 p-3 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
                                        <div className="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0"></div>
                                        <span className="text-emerald-200 text-sm font-medium">{term}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Compliance Requirements */}
                {analysis.complianceRequirements && analysis.complianceRequirements.length > 0 && (
                    <Card className="bg-purple-500/10 backdrop-blur-lg border border-purple-500/30 shadow-2xl">
                        <CardHeader>
                            <CardTitle className="flex items-center text-purple-300">
                                <Shield className="h-5 w-5 mr-2" />
                                Compliance Requirements
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {analysis.complianceRequirements.map((req: string, index: number) => (
                                    <div key={index} className="flex items-center space-x-3 p-3 bg-purple-500/20 rounded-lg border border-purple-500/30">
                                        <div className="w-2 h-2 bg-purple-400 rounded-full flex-shrink-0"></div>
                                        <span className="text-purple-200 text-sm font-medium">{req}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Improvements */}
                {analysis.improvements && analysis.improvements.length > 0 && (
                    <Card className="bg-blue-500/10 backdrop-blur-lg border border-blue-500/30 shadow-2xl">
                        <CardHeader>
                            <CardTitle className="flex items-center text-blue-300">
                                <Lightbulb className="h-5 w-5 mr-2" />
                                Suggested Improvements
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {analysis.improvements.map((improvement: string, index: number) => (
                                    <div key={index} className="flex items-start space-x-3 p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
                                        <Lightbulb className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                        <span className="text-blue-200 text-sm">{improvement}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Document Type and Confidence */}
            <div className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-lg rounded-lg border border-white/20">
                <div className="flex items-center space-x-4">
                    {(analysis.documentType || analysis.verdict) && (
                        <Badge
                            variant="outline"
                            className="bg-white/10 border-white/30 text-white"
                        >
                            {analysis.documentType || analysis.verdict}
                        </Badge>
                    )}
                    {analysis.confidence && (
                        <Badge
                            variant="outline"
                            className="bg-white/10 border-white/30 text-white"
                        >
                            {Math.round(analysis.confidence * 100)}% confidence
                        </Badge>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StructuredAnalysis; 
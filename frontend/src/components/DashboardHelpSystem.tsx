import React, { useState } from 'react';
import { HelpCircle, X, ChevronLeft, ChevronRight, Home, Users, CreditCard, Calculator, Wallet, Shield, BarChart3, Settings, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface HelpStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  content: string;
  features: string[];
  tips?: string[];
}

const helpSteps: HelpStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Melenco Factoring',
    description: 'Your comprehensive trade finance operations portal',
    icon: Home,
    content: 'Melenco Factoring is a complete trade finance management platform that streamlines your operations from entity management to final reporting. This interactive guide will walk you through all the key features and functionality.',
    features: [
      'Real-time transaction monitoring',
      'Automated fee calculations',
      'Risk management tools',
      'Comprehensive reporting suite',
      'Treasury operations management'
    ]
  },
  {
    id: 'dashboard',
    title: 'Dashboard Overview',
    description: 'Your operational command center',
    icon: Home,
    content: 'The dashboard provides a real-time overview of your trade finance operations with key performance indicators, transaction summaries, and quick access to critical functions.',
    features: [
      'KPI Cards: Total transactions, active deals, volumes, and pending approvals',
      'Transaction Volume Chart: Visual trend analysis of monthly transaction flows',
      'Buyer Exposure Chart: Risk distribution across your customer portfolio',
      'Recent Transactions: Latest activity with status updates',
      'Quick Actions: Fast access to create new transactions and entities'
    ],
    tips: [
      'Click on any KPI card to drill down into detailed views',
      'Use the date filters to analyze specific time periods',
      'Hover over charts for detailed breakdowns'
    ]
  },
  {
    id: 'entities',
    title: 'Entity Management',
    description: 'Manage buyers and suppliers',
    icon: Users,
    content: 'The Entities section allows you to manage your business relationships including buyers, suppliers, and their associated risk profiles, credit limits, and transaction history.',
    features: [
      'Buyer Management: Add, edit, and monitor customer profiles with credit limits',
      'Supplier Management: Maintain supplier information, certifications, and payment terms',
      'Risk Assessment: Automated risk scoring based on transaction history',
      'Document Management: Store and manage entity-related documentation',
      'Relationship Mapping: Visual representation of business relationships'
    ],
    tips: [
      'Keep entity information updated for accurate risk assessment',
      'Use filters to quickly find specific entities',
      'Review credit limits regularly based on performance'
    ]
  },
  {
    id: 'transactions',
    title: 'Transaction Processing',
    description: 'Core trade finance operations',
    icon: CreditCard,
    content: 'Process all types of trade finance transactions including Letters of Credit, Bank Guarantees, Documentary Collections, and Trade Finance Loans with full workflow management.',
    features: [
      'Multi-Product Support: Handle various trade finance instruments',
      'Workflow Management: Automated approval processes and status tracking',
      'Document Handling: Upload, review, and manage transaction documents',
      'Compliance Checking: Automatic validation against limits and regulations',
      'Status Tracking: Real-time updates on transaction progress'
    ],
    tips: [
      'Complete all required fields before submitting for approval',
      'Upload documents in supported formats (PDF, JPG, PNG)',
      'Use the preview feature to verify transaction details'
    ]
  },
  {
    id: 'fee-limits',
    title: 'Fee & Limits Management',
    description: 'Automated rule enforcement',
    icon: Calculator,
    content: 'Configure fee structures and limit frameworks with automated calculation engines and real-time compliance checking to ensure consistent policy enforcement.',
    features: [
      'Fee Configuration: Set up processing fees, commissions, and documentary charges',
      'Limit Management: Define customer, product, country, and currency limits',
      'Automated Calculations: Real-time fee computation with preview functionality',
      'Tier-based Pricing: Volume-based fee structures for different customer segments',
      'Compliance Monitoring: Automatic limit checking and breach alerts'
    ],
    tips: [
      'Use the fee calculator to preview charges before finalizing',
      'Set up tiered pricing to reward high-volume customers',
      'Regularly review and update limits based on risk assessments'
    ]
  },
  {
    id: 'treasury',
    title: 'Treasury Operations',
    description: 'Fund execution and management',
    icon: Wallet,
    content: 'Manage all treasury functions including disbursements, reserve management, and financial ledger maintenance with full audit trail capabilities.',
    features: [
      'Disbursement Processing: Queue, approve, and execute payments with bulk operations',
      'Reserve Management: Track regulatory, risk, and operational reserves',
      'Financial Ledger: Complete transaction history with automated entries',
      'Cash Position: Real-time view of account balances and positions',
      'Reconciliation Tools: Match transactions with bank statements'
    ],
    tips: [
      'Use bulk processing for efficiency with multiple disbursements',
      'Monitor reserve ratios to ensure compliance',
      'Regular reconciliation prevents discrepancies'
    ]
  },
  {
    id: 'monitoring',
    title: 'Risk Monitoring & Oversight',
    description: 'Real-time health tracking',
    icon: Shield,
    content: 'Comprehensive monitoring system that tracks transaction health, manages alerts, and provides risk indicators with automated scoring and aging analysis.',
    features: [
      'Health Dashboard: Real-time status of all transactions with aging analysis',
      'Alert Management: Automated notifications for critical events and thresholds',
      'Risk Scoring: Dynamic risk assessment based on multiple factors',
      'Aging Analysis: Transaction lifecycle tracking with overdue identification',
      'Bulk Operations: Efficient management of multiple alerts and issues'
    ],
    tips: [
      'Set up alert thresholds based on your risk appetite',
      'Review aging reports regularly to prevent overdue situations',
      'Use bulk resolution for similar alerts to save time'
    ]
  },
  {
    id: 'reports',
    title: 'Reports & Analytics',
    description: 'Comprehensive reporting suite',
    icon: BarChart3,
    content: 'Generate, schedule, and manage operational reports with template-based system supporting multiple formats and automated distribution.',
    features: [
      'Report Templates: Pre-built templates for operational, financial, risk, and compliance reports',
      'Custom Configuration: Flexible parameters and filters for tailored reports',
      'Scheduled Reports: Automated generation and distribution on defined schedules',
      'Multiple Formats: Export to PDF, Excel, CSV, and JSON formats',
      'Execution Tracking: Monitor report generation status and history'
    ],
    tips: [
      'Schedule regular reports to automate routine tasks',
      'Use date range filters to focus on specific periods',
      'Save frequently used configurations as templates'
    ]
  },
  {
    id: 'notifications',
    title: 'Notification System',
    description: 'Stay informed with real-time alerts',
    icon: Play,
    content: 'Integrated notification system that keeps you informed of critical events, system updates, and required actions with intelligent prioritization.',
    features: [
      'Real-time Notifications: Instant alerts for critical events and system updates',
      'Severity Classification: Color-coded alerts by importance (info, warning, critical)',
      'Action Items: Direct links to relevant sections for quick resolution',
      'Read Status Tracking: Mark notifications as read/unread for better organization',
      'Bulk Management: Handle multiple notifications efficiently'
    ],
    tips: [
      'Check notifications regularly to stay updated on system events',
      'Use bulk actions to mark multiple notifications as read',
      'Click on notification actions to navigate directly to relevant sections'
    ]
  },
  {
    id: 'settings',
    title: 'Settings & Configuration',
    description: 'Customize your experience',
    icon: Settings,
    content: 'Personalize your portal experience with user preferences, security settings, and system configuration options tailored to your role and responsibilities.',
    features: [
      'User Profile: Manage personal information and contact details',
      'Display Preferences: Customize dashboard layout and default views',
      'Security Settings: Password management and access control',
      'Notification Preferences: Control alert types and delivery methods',
      'System Configuration: Role-based settings and permissions'
    ],
    tips: [
      'Keep your profile information current for accurate communications',
      'Set up notification preferences to avoid alert overload',
      'Regularly update passwords for security'
    ]
  }
];

interface DashboardHelpSystemProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DashboardHelpSystem({ isOpen, onClose }: DashboardHelpSystemProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [viewMode, setViewMode] = useState<'overview' | 'guided'>('overview');

  const handleNext = () => {
    if (currentStep < helpSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (index: number) => {
    setCurrentStep(index);
    setViewMode('guided');
  };

  const currentHelpStep = helpSteps[currentStep];
  const StepIcon = currentHelpStep?.icon || Home;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader className="pb-4 sticky top-0 bg-background z-10 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">
              Melenco Factoring - Interactive Guide
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {viewMode === 'overview' ? (
          <div className="space-y-6 px-1">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">Welcome to Your Operations Portal</h3>
              <p className="text-muted-foreground">
                Choose a section to learn about its functionality, or take a guided tour
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto pr-2">
              {helpSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <Card 
                    key={step.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleStepClick(index)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-sm">{step.title}</CardTitle>
                          <CardDescription className="text-xs">
                            {step.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {step.content}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <Badge variant="outline" className="text-xs">
                          {step.features.length} features
                        </Badge>
                        <Button size="sm" variant="ghost" className="text-xs">
                          Learn More →
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex justify-center gap-3">
              <Button 
                onClick={() => {
                  setCurrentStep(0);
                  setViewMode('guided');
                }}
                className="gap-2"
              >
                <Play className="w-4 h-4" />
                Start Guided Tour
              </Button>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 px-1">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progress</span>
                <span>{currentStep + 1} of {helpSteps.length}</span>
              </div>
              <Progress value={(currentStep + 1) / helpSteps.length * 100} />
            </div>

            {/* Current Step Content */}
            <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <StepIcon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{currentHelpStep.title}</h3>
                  <p className="text-muted-foreground">{currentHelpStep.description}</p>
                </div>
              </div>

              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm leading-relaxed">{currentHelpStep.content}</p>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Key Features:</h4>
                <div className="grid gap-2">
                  {currentHelpStep.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {currentHelpStep.tips && (
                <div className="space-y-3">
                  <h4 className="font-medium">💡 Pro Tips:</h4>
                  <div className="grid gap-2">
                    {currentHelpStep.tips.map((tip, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <div className="w-1 h-1 rounded-full bg-muted-foreground mt-2.5 flex-shrink-0" />
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4 border-t bg-background sticky bottom-0">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setViewMode('overview')}
                >
                  ← Back to Overview
                </Button>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handlePrevious} 
                  disabled={currentStep === 0}
                  className="gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                {currentStep === helpSteps.length - 1 ? (
                  <Button onClick={onClose} className="gap-2">
                    Finish Tour
                    <X className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button onClick={handleNext} className="gap-2">
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function HelpTrigger() {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsHelpOpen(true)}
        className="gap-2"
      >
        <HelpCircle className="w-4 h-4" />
        Help Guide
      </Button>
      <DashboardHelpSystem 
        isOpen={isHelpOpen} 
        onClose={() => setIsHelpOpen(false)} 
      />
    </>
  );
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sparkles, Database, Code, Zap, Shield, TrendingUp } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      {/* Header */}
      <div className="text-center mb-16 py-12">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">About FlowbitAI</h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Revolutionizing document processing with AI-powered intelligence
        </p>
      </div>

      <Separator className="mb-16" />

      {/* Mission Section */}
      <Card className="mb-8 border-2">
        <CardHeader>
          <CardTitle className="text-2xl">Our Mission</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed text-base">
            FlowbitAI is revolutionizing document processing with AI-powered 
            intelligence. We help businesses extract, analyze, and understand 
            their documents automatically, turning unstructured data into actionable insights.
          </p>
        </CardContent>
      </Card>

      {/* What We Do */}
      <Card className="mb-8 border-2">
        <CardHeader>
          <CardTitle className="text-2xl">What We Do</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {[
              'Automated document extraction from PDFs, images, and scans',
              'AI-powered data classification and categorization',
              'Natural language queries on your document database',
              'Invoice processing and financial document analysis',
              'Custom document workflows and automation',
            ].map((item, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                <span className="text-base pt-0.5">{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Technology Stack */}
      <Card className="mb-8 border-2">
        <CardHeader>
          <CardTitle className="text-2xl">Technology Stack</CardTitle>
          <CardDescription className="text-base">
            Built with cutting-edge technologies for optimal performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Code className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Frontend</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-sm">Next.js 15</Badge>
                  <Badge variant="secondary" className="text-sm">React 19</Badge>
                  <Badge variant="secondary" className="text-sm">Tailwind CSS</Badge>
                  <Badge variant="secondary" className="text-sm">shadcn/ui</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">AI & Backend</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-sm">Vanna AI</Badge>
                  <Badge variant="secondary" className="text-sm">Groq LLM</Badge>
                  <Badge variant="secondary" className="text-sm">FastAPI</Badge>
                  <Badge variant="secondary" className="text-sm">Python</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Database className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Database</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-sm">PostgreSQL</Badge>
                  <Badge variant="secondary" className="text-sm">Supabase</Badge>
                  <Badge variant="secondary" className="text-sm">Real-time</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Processing</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-sm">OCR</Badge>
                  <Badge variant="secondary" className="text-sm">Computer Vision</Badge>
                  <Badge variant="secondary" className="text-sm">NLP</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Key Features */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-2xl">Key Features</CardTitle>
          <CardDescription className="text-base">
            Powerful capabilities designed for modern businesses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="border-l-4 border-primary pl-6">
            <div className="flex items-start gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-lg pt-2">
                Natural Language Queries
              </h3>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Ask questions about your documents in plain English. 
              Our AI converts your questions to SQL and retrieves the data instantly.
            </p>
          </div>

          <div className="border-l-4 border-primary pl-6">
            <div className="flex items-start gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-lg pt-2">
                Automated Extraction
              </h3>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Upload any document and watch as AI extracts key information: 
              vendors, customers, amounts, dates, and more.
            </p>
          </div>

          <div className="border-l-4 border-primary pl-6">
            <div className="flex items-start gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-lg pt-2">
                Real-time Analytics
              </h3>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Generate complex analytics and reports with simple questions. 
              Trend analysis, risk assessment, and financial insights.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

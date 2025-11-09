import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sparkles, Zap, BarChart3, MessageSquare, Database, TrendingUp, ArrowRight, CheckCircle } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <Badge variant="outline" className="text-sm font-medium">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            AI-Powered Analytics Platform
          </Badge>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
            Transform Documents into
            <span className="block text-primary">Actionable Insights</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Query your document database using natural language. 
            Our AI instantly converts your questions into SQL and delivers precise results.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" className="text-base" asChild>
              <Link href="/query">
                Start Querying
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-base" asChild>
              <Link href="/about">
                Learn More
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Separator className="container mx-auto" />

      {/* Features Grid */}
            {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Built for Modern Data Teams
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Powerful features designed to streamline your data workflow
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader className="space-y-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Natural Language</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Ask questions in plain English. No SQL knowledge required—our AI handles the complexity.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader className="space-y-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Instant Results</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Get accurate answers in seconds with AI-powered query generation and execution.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader className="space-y-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Complex Analytics</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Handle intricate queries and multi-table relationships with confidence and ease.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      <Separator className="container mx-auto" />

      {/* Example Questions */}
      <section className="container mx-auto px-4 py-20">
        <Card className="max-w-4xl mx-auto border-2">
          <CardHeader className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">Example Queries</CardTitle>
                <CardDescription className="text-base mt-1">
                  Click any question to see our AI in action
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: Database, text: 'How many documents are in the database?' },
                { icon: TrendingUp, text: 'Show me all vendors' },
                { icon: BarChart3, text: 'What is the total invoice amount?' },
                { icon: Sparkles, text: 'List top 5 customers by invoice amount' },
                { icon: Zap, text: 'Show invoices from the last 30 days' },
                { icon: MessageSquare, text: 'Calculate month-over-month revenue growth' },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={idx}
                    variant="outline"
                    className="justify-start h-auto py-4 px-4 hover:bg-accent hover:border-primary/50 transition-colors"
                    asChild
                  >
                    <Link href={`/query?q=${encodeURIComponent(item.text)}`}>
                      <div className="flex items-start gap-3 text-left w-full">
                        <Icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span className="text-sm font-medium">{item.text}</span>
                      </div>
                    </Link>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start querying your data with AI-powered natural language processing today.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-base" asChild>
              <Link href="/query">
                Start Querying
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-base" asChild>
              <Link href="/about">
                View Documentation
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { vannaAPI, QueryResult } from '@/lib/api/vanna';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Sparkles, Code2, AlertCircle, CheckCircle, Database } from 'lucide-react';

export default function VannaQuery() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [showSQL, setShowSQL] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    console.log('🚀 Submitting question via /ask endpoint:', question);
    setLoading(true);
    setResult(null);

    try {
      const response = await vannaAPI.ask(question, true);
      console.log('✅ API Response from /ask:', response);
      setResult(response);
      setShowSQL(true);
    } catch (error) {
      console.error('❌ API Error from /ask:', error);
      setResult({
        success: false,
        question,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSQL = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await vannaAPI.generateSQL(question);
      setResult(response);
      setShowSQL(true);
    } catch (error) {
      setResult({
        success: false,
        question,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className=" container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-12 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">Ask Your Data</h1>
        </div>
        <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
          Ask questions about your documents in natural language and get instant answers
        </p>
      </div>

      {/* Query Input Card */}
      <Card className="mb-6 border-2">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Query Interface</CardTitle>
              <CardDescription className="mt-1">
                Type your question below and let AI generate the SQL for you
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g., How many documents are in the database?"
                disabled={loading}
                className="flex-1 h-11"
              />
              <Button 
                type="submit" 
                disabled={loading || !question.trim()}
                size="lg"
                className="sm:w-auto w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Ask
                  </>
                )}
              </Button>
            </div>
            
            <Button
              type="button"
              variant="outline"
              onClick={handleGenerateSQL}
              disabled={loading || !question.trim()}
            >
              <Code2 className="mr-2 h-4 w-4" />
              Generate SQL Only
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Sample Questions */}
      <Card className="mb-8 border-2">
        <CardHeader>
          <CardTitle className="text-lg">Quick Start Examples</CardTitle>
          <CardDescription>
            Click any example to populate the query field
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[
              'How many documents are there?',
              'Show me all vendors',
              'What is the total invoice amount?',
              'List top 5 customers by invoice amount',
            ].map((sample) => (
              <Badge
                key={sample}
                variant="secondary"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors px-3 py-2 text-sm"
                onClick={() => setQuestion(sample)}
              >
                {sample}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Tabs defaultValue="results" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12">
            <TabsTrigger value="results" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Results
            </TabsTrigger>
            <TabsTrigger value="sql" className="gap-2">
              <Code2 className="h-4 w-4" />
              SQL Query
            </TabsTrigger>
          </TabsList>

          {/* Results Tab */}
          <TabsContent value="results" className="mt-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-xl">Query Results</CardTitle>
                <CardDescription className="text-base mt-1">
                  {result.success && result.results && result.results.length > 0
                    ? `Found ${result.row_count} ${result.row_count === 1 ? 'row' : 'rows'}`
                    : 'Results will appear here'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Error Display */}
                {!result.success && result.error && (
                  <Alert variant="destructive" className="border-2">
                    <AlertCircle className="h-5 w-5" />
                    <AlertTitle className="text-base">Error</AlertTitle>
                    <AlertDescription className="text-sm">{result.error}</AlertDescription>
                  </Alert>
                )}

                {/* Results Display */}
                {result.success && Array.isArray(result.results) && result.results.length > 0 ? (
                  <div className="space-y-4">
                    {result.explanation && (
                      <p className="text-sm text-muted-foreground leading-relaxed">{result.explanation}</p>
                    )}
                    <div className="rounded-lg border-2 overflow-hidden">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              {Object.keys(result.results[0]).map((key) => (
                                <TableHead key={key} className="font-semibold">{key}</TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {result.results.map((row, idx) => (
                              <TableRow key={idx} className="hover:bg-muted/50">
                                {Object.values(row).map((value, cellIdx) => (
                                  <TableCell key={cellIdx} className="font-mono">
                                    {value !== null && value !== undefined ? String(value) : (
                                      <span className="text-muted-foreground italic text-sm">NULL</span>
                                    )}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                ) : result.success && !result.results ? (
                  <Alert className="border-2">
                    <AlertCircle className="h-5 w-5" />
                    <AlertTitle className="text-base">Query Executed</AlertTitle>
                    <AlertDescription className="text-sm">
                      SQL was generated successfully, but no results were returned. This may happen if the query execution was skipped or encountered an issue.
                      <br /><br />
                      Try clicking the "SQL Query" tab to view the generated SQL, then try again.
                    </AlertDescription>
                  </Alert>
                ) : result.success && Array.isArray(result.results) && result.results.length === 0 ? (
                  <Alert className="border-2">
                    <AlertCircle className="h-5 w-5" />
                    <AlertTitle className="text-base">No Results Found</AlertTitle>
                    <AlertDescription className="text-sm">
                      Query executed successfully but returned no results. Try modifying your question.
                    </AlertDescription>
                  </Alert>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SQL Tab */}
          <TabsContent value="sql" className="mt-6">
            {result.sql && (
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-xl">Generated SQL Query</CardTitle>
                  <CardDescription className="text-base mt-1">
                    This query was automatically generated from your question
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="p-6 rounded-lg bg-muted border-2 overflow-x-auto">
                    <code className="text-sm font-mono">{result.sql}</code>
                  </pre>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
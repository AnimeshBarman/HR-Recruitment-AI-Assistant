import React from 'react';
import { useLocation, Navigate, Link } from 'react-router-dom';
import ResumeList from '../components/ResumeList';
import ResumeChat from '../components/ResumeChat';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const ResultsPage = () => {
  const location = useLocation();

  if (!location.state?.data?.results) {
    return <Navigate to="/" />;
  }

  const { sessionId, results } = location.state.data;

  return (
    <div className="h-screen w-screen bg-gray-500 p-6 flex flex-col gap-4">
      <div className="flex-shrink-0">
        <Link to="/"><Button variant="outline">← Start New Analysis</Button></Link>
      </div>
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
          <div className="lg:col-span-1 flex flex-col overflow-hidden">
            <Card className="flex-grow flex flex-col bg-slate-200 overflow-hidden">
              <CardHeader><CardTitle className="text-2xl">Ranked Resumes</CardTitle></CardHeader>
              <ResumeList resumes={results} />
            </Card>
          </div>
      
        <div className="lg:col-span-1 h-full pl-30 overflow-hidden">
            <Card className="h-full">
              <ResumeChat sessionId={sessionId} />
            </Card>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
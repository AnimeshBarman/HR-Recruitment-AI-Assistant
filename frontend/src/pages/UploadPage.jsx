import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from "sonner";
import ResumeUploadForm from '../components/ResumeUploadForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const UploadPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleAnalyze = async (jd, resumes) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append("jd", jd);
    resumes.forEach(file => formData.append("resumes", file));

    toast.info("Analyzing resumes... This may take a moment.");

    try {
      const response = await axios.post("http://localhost:8000/api/analyze-resumes", formData);
      toast.success("Analysis complete! Redirecting...");
      
      navigate('/results', { state: { data: response.data } });

    } catch (err) {
      console.error("Error analyzing resumes:", err);
      const errorMessage = err.response?.data?.detail || "An unknown error occurred.";
      toast.error("Analysis Failed", { description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-500 p-4">
      <Card className="w-full bg-slate-200
       max-w-3xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-gray-800">
            AI Recruitment Assistant
          </CardTitle>
          <CardDescription className="text-center text-lg text-gray-500 pt-2">
            Get instant insights from multiple resumes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResumeUploadForm onAnalyze={handleAnalyze} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadPage;
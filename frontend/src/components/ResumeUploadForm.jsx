import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { File, X } from 'lucide-react';

const ResumeUploadForm = ({ onAnalyze, isLoading }) => {
  const [jd, setJd] = useState("");
  const [resumes, setResumes] = useState([]);

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setResumes(prev => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (indexToRemove) => {
    setResumes(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!jd.trim() || resumes.length === 0) {
      toast.warning("JD and Resumes are required!");
      return;
    }
    onAnalyze(jd, resumes);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="jobDescription" className="text-lg font-medium">Job Description</Label>
        <Textarea
          id="jobDescription"
          placeholder="Paste the job description here..."
          rows={10}
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          className="resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="resumes" className="text-lg font-medium">Upload Resumes</Label>
        <Input
          id="resumes"
          type="file"
          multiple
          accept=".pdf,.doc,.docx"
          onChange={handleFileChange}
        />
        {resumes.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="font-semibold">Selected Files:</h4>
            <ul className="space-y-2">
              {resumes.map((file, index) => (
                <li key={index} className="flex items-center justify-between p-2 bg-gray-100 rounded-md">
                  <div className="flex items-center gap-2">
                    <File size={16} className="text-gray-600" />
                    <span className="text-sm">{file.name}</span>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveFile(index)}>
                    <X size={16} />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <Button type="submit" className="w-full text-lg py-6" disabled={isLoading}>
        {isLoading ? 'Analyzing...' : 'Analyze Resumes'}
      </Button>
    </form>
  );
};

export default ResumeUploadForm;
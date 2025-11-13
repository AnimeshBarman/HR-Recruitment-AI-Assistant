import React, { useState } from 'react';
import { Progress } from "@/components/ui/progress";
import { ChevronDown } from 'lucide-react';

const ResumeItem = ({ resume }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border bg-white rounded-lg mb-2 overflow-hidden transition-all duration-300">
      <div
        className="p-4 cursor-pointer flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex-grow flex flex-col items-start gap-2 pr-4 text-left">
          <div className="flex justify-between w-full">
            <span className="font-semibold text-md truncate">{resume.filename}</span>
            <span className="text-lg font-bold text-blue-600">{Math.round(resume.match_percentage)}%</span>
          </div>
          <Progress value={resume.match_percentage} className="h-2" />
        </div>
        <ChevronDown
          size={24}
          className={`text-gray-500 flex-shrink-0 transition-transform duration-300 ease-in-out ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>
      <div className={`transition-all duration-300 ease-in-out grid ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="p-4 bg-gray-50 border-t">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-700">Summary</h4>
                <p className="text-sm text-gray-600">{resume.summary || "No summary available."}</p>
              </div>
              <div>
                <h4 className="font-semibold text-green-700">Strengths</h4>
                <ul className="list-disc list-inside text-sm text-green-600">
                  {Array.isArray(resume.strengths) && resume.strengths.length > 0 
                    ? resume.strengths.map((s, i) => <li key={i}>{s}</li>)
                    : <li>No strengths identified.</li>
                  }
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-red-700">Weaknesses</h4>
                <ul className="list-disc list-inside text-sm text-red-600">
                  {Array.isArray(resume.weaknesses) && resume.weaknesses.length > 0 
                    ? resume.weaknesses.map((w, i) => <li key={i}>{w}</li>)
                    : <li>No weaknesses identified.</li>
                  }
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeItem;
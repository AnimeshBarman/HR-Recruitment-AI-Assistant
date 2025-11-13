import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import ResumeItem from './ResumeItem';

const ResumeList = ({ resumes }) => {
  return (
    <ScrollArea className="flex-grow h-full">
      <div className="p-4">
        {Array.isArray(resumes) && resumes.map((resume) => (
          <ResumeItem key={resume.id} resume={resume} />
        ))}
      </div>
    </ScrollArea>
  );
};

export default ResumeList;
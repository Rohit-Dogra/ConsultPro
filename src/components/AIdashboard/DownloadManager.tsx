
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { downloadService } from '@/services/downloadService';

const DownloadManager = () => {
  const { toast } = useToast();

  const handleDownload = async (format: string) => {
    toast({
      title: "Download Started",
      description: `Your business plan is being downloaded in ${format.toUpperCase()} format.`,
    });

    try {
      if (format === 'pdf') {
        await downloadService.downloadAsPDF();
      } else if (format === 'docx') {
        await downloadService.downloadAsDOCX();
      }

      toast({
        title: "Download Complete",
        description: `Your business plan has been downloaded successfully.`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "There was an error downloading your business plan. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex space-x-3">
      <Button variant="outline" onClick={() => handleDownload('pdf')} className="flex items-center">
        <Download size={16} className="mr-2" /> PDF
      </Button>
      <Button variant="outline" onClick={() => handleDownload('docx')} className="flex items-center">
        <FileText size={16} className="mr-2" /> DOCX
      </Button>
      <Button className="bg-blue-500 hover:bg-blue-600">Interactive Report</Button>
    </div>
  );
};

export default DownloadManager;

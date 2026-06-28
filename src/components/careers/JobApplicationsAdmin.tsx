import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye, Download, Mail, Phone, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface Application {
  id: string;
  name: string;
  email: string;
  phone: string;
  resume_url: string;
  cover_letter?: string;
  status: string;
  applied_at: string;
  job_title: string;
}

interface ApplicationDetail extends Application {
  answers: Array<{
    question: string;
    answer: string;
    question_type: string;
  }>;
}

const JobApplicationsAdmin: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [jobs, setJobs] = useState<Array<{id: string, title: string}>>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('all');

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (selectedJobId && selectedJobId !== 'all') {
      fetchApplications(selectedJobId);
    } else if (selectedJobId === 'all') {
      fetchAllApplications();
    }
  }, [selectedJobId]);

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/careers/jobs');
      const data = await response.json();
      if (data.success) {
        setJobs(data.jobs);
        if (data.jobs.length > 0) {
          setSelectedJobId('all');
        }
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const fetchApplications = async (jobId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/careers/jobs/${jobId}/applications`);
      const data = await response.json();
      if (data.success) {
        setApplications(data.applications);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllApplications = async () => {
    try {
      setLoading(true);
      // Fetch applications for all jobs
      const allApplications: Application[] = [];
      for (const job of jobs) {
        const response = await fetch(`/api/careers/jobs/${job.id}/applications`);
        const data = await response.json();
        if (data.success) {
          allApplications.push(...data.applications);
        }
      }
      setApplications(allApplications);
    } catch (error) {
      console.error('Error fetching all applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicationDetail = async (applicationId: string) => {
    try {
      const response = await fetch(`/api/careers/applications/${applicationId}`);
      const data = await response.json();
      if (data.success) {
        setSelectedApplication(data.application);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error('Error fetching application detail:', error);
      toast.error('Failed to load application details');
    }
  };

  const updateApplicationStatus = async (applicationId: string, status: string) => {
    try {
      const response = await fetch(`/api/careers/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Application status updated');
        // Refresh applications
        if (selectedJobId === 'all') {
          fetchAllApplications();
        } else {
          fetchApplications(selectedJobId);
        }
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      reviewing: 'bg-blue-100 text-blue-800',
      shortlisted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      hired: 'bg-purple-100 text-purple-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Job Applications</h1>
        
        <div className="flex gap-4 items-center">
          <Select value={selectedJobId} onValueChange={setSelectedJobId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a job..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Jobs</SelectItem>
              {jobs.map((job) => (
                <SelectItem key={job.id} value={job.id}>
                  {job.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="text-sm text-gray-600">
            {applications.length} applications
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No applications found</p>
            </div>
          ) : (
            applications.map((application) => (
              <Card key={application.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{application.name}</CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {application.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {application.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(application.applied_at).toLocaleDateString()}
                        </span>
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(application.status)}>
                      {application.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm text-gray-600">Applied for:</p>
                      <p className="font-semibold">{application.job_title}</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchApplicationDetail(application.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(application.resume_url, '_blank')}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Resume
                      </Button>
                      
                      <Select
                        value={application.status}
                        onValueChange={(status) => updateApplicationStatus(application.id, status)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="reviewing">Reviewing</SelectItem>
                          <SelectItem value="shortlisted">Shortlisted</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="hired">Hired</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Application Detail Modal */}
      {showDetailModal && selectedApplication && (
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Application Details - {selectedApplication.name}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Contact Information</h3>
                  <p><strong>Name:</strong> {selectedApplication.name}</p>
                  <p><strong>Email:</strong> {selectedApplication.email}</p>
                  <p><strong>Phone:</strong> {selectedApplication.phone}</p>
                  <p><strong>Applied:</strong> {new Date(selectedApplication.applied_at).toLocaleString()}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Job Information</h3>
                  <p><strong>Position:</strong> {selectedApplication.job_title}</p>
                  <p><strong>Status:</strong> 
                    <Badge className={`ml-2 ${getStatusColor(selectedApplication.status)}`}>
                      {selectedApplication.status}
                    </Badge>
                  </p>
                </div>
              </div>

              {selectedApplication.cover_letter && (
                <div>
                  <h3 className="font-semibold mb-2">Cover Letter</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="whitespace-pre-wrap">{selectedApplication.cover_letter}</p>
                  </div>
                </div>
              )}

              {selectedApplication.answers && selectedApplication.answers.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Additional Questions</h3>
                  <div className="space-y-4">
                    {selectedApplication.answers.map((answer, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <p className="font-medium mb-2">{answer.question}</p>
                        <p className="text-gray-700">{answer.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => window.open(selectedApplication.resume_url, '_blank')}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download Resume
                </Button>
                <Button onClick={() => setShowDetailModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default JobApplicationsAdmin;
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Users, Briefcase, Building2, DollarSign } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { IndianRupee } from "lucide-react";
import JobApplicationModal from '@/components/careers/JobApplicationModal';
import SEOHead from '@/components/SEO/SEOHead';
import { pageSEOConfig } from '@/config/seo';

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  job_type: string;
  experience_level: string;
  description: string;
  requirements: string;
  responsibilities: string;
  salary_range?: string;
  benefits?: string;
  created_at: string;
}

const Careers: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/careers/jobs`);
      const data = await response.json();
      if (data.success) {
        setJobs(data.jobs);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyClick = (job: Job) => {
    setSelectedJob(job);
    setShowApplicationModal(true);
  };

  // Animation keyframes for floating effect
  const floatAnimation = `
    @keyframes float {
      0% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
      100% { transform: translateY(0px); }
    }
    @keyframes fadeInUp {
      0% { opacity: 0; transform: translateY(20px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    .animate-float {
      animation: float 3s ease-in-out infinite;
    }
  `;

  // Add the styles to the head
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = floatAnimation;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, [floatAnimation]); 

  const getJobTypeColor = (type: string) => {
    const colors = {
      'full-time': 'bg-green-100 text-green-800',
      'part-time': 'bg-blue-100 text-blue-800',
      'contract': 'bg-orange-100 text-orange-800',
      'internship': 'bg-purple-100 text-purple-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getExperienceColor = (level: string) => {
    const colors = {
      'entry': 'bg-green-100 text-green-800',
      'mid': 'bg-blue-100 text-blue-800',
      'senior': 'bg-orange-100 text-orange-800',
      'executive': 'bg-red-100 text-red-800'
    };
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Navbar />
        <div className="pt-20 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading opportunities...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <SEOHead 
        title={pageSEOConfig.careers.title}
        description={pageSEOConfig.careers.description}
        keywords={pageSEOConfig.careers.keywords}
        url="https://expertisestation.com/careers"
      />
      <Navbar />
      <div className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
              <Briefcase className="h-4 w-4 mr-2" />
              Career Opportunities
            </div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
              Join Our Mission
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Be part of a team that's revolutionizing how expertise is shared globally. 
              Discover opportunities that match your passion and skills.
            </p>
          </div>

          {/* Stats Cards */}
          {jobs.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 text-center shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="h-8 w-8 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{jobs.length}</div>
                <div className="text-gray-600 font-medium">Open Positions</div>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 text-center shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-8 w-8 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {new Set(jobs.map(job => job.department)).size}
                </div>
                <div className="text-gray-600 font-medium">Departments</div>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 text-center shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-8 w-8 text-purple-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {new Set(jobs.map(job => job.location)).size}
                </div>
                <div className="text-gray-600 font-medium">Locations</div>
              </div>
            </div>
          )}

          {/* Job Listings */}
          <div className="space-y-8">
            {jobs.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Briefcase className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">No Open Positions</h3>
                <p className="text-gray-600 text-lg">We're not hiring right now, but check back soon for new opportunities!</p>
                <Button className="mt-6" onClick={() => window.location.href = '/contact'}>
                  Get Notified
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Open Positions</h2>
                  <p className="text-gray-600">Find your perfect role and apply today</p>
                </div>
                {jobs.map((job) => (
                  <Card key={job.id} className="group hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="pb-4">
                      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                            {job.title}
                          </CardTitle>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full">
                              <Building2 className="h-4 w-4" />
                              {job.department}
                            </span>
                            <span className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full">
                              <MapPin className="h-4 w-4" />
                              {job.location}
                            </span>
                            <span className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full">
                              <Clock className="h-4 w-4" />
                              {new Date(job.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge className={`${getJobTypeColor(job.job_type)} px-3 py-1 text-sm font-medium`}>
                            {job.job_type.replace('-', ' ')}
                          </Badge>
                          <Badge className={`${getExperienceColor(job.experience_level)} px-3 py-1 text-sm font-medium`}>
                            {job.experience_level} level
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-6">
                        <p className="text-gray-700 text-lg leading-relaxed line-clamp-2">
                          {job.description}
                        </p>
                        
                        {job.salary_range && (
                          <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg">
                           <IndianRupee className="h-5 w-5 text-green-600" />
                            <span className="font-semibold text-green-800">{job.salary_range}</span>
                          </div>
                        )}
                        
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pt-4 border-t border-gray-100">
                          <div className="text-sm text-gray-500">
                            Posted {new Date(job.created_at).toLocaleDateString()}
                          </div>
                          <Button 
                            onClick={() => handleApplyClick(job)}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-2 rounded-full font-semibold transition-all duration-300 transform hover:scale-105"
                          >
                            Apply Now
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />

      {/* Application Modal */}
      {showApplicationModal && selectedJob && (
        <JobApplicationModal
          job={selectedJob}
          isOpen={showApplicationModal}
          onClose={() => {
            setShowApplicationModal(false);
            setSelectedJob(null);
          }}
        />
      )}
    </div>
  );
};

export default Careers;
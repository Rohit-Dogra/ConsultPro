import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Target, TrendingUp, CheckCircle, Zap } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { caseStudyApi, type CaseStudy } from '../services/caseStudyApi';

const CaseStudyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [study, setStudy] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCaseStudy = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        let caseStudyData;
        
        try {
          caseStudyData = await caseStudyApi.getCaseStudy(id);
        } catch (apiError) {
          // If case study not found, seed database and try again
          console.log('Case study not found, seeding database...');
          await caseStudyApi.seedDatabase();
          caseStudyData = await caseStudyApi.getCaseStudy(id);
        }
        
        // Map database fields to component structure
        const mappedStudy = {
          icon: caseStudyData.cover_image ? <img src={caseStudyData.cover_image} alt="icon" className="w-16 h-16" /> : <Zap className="w-16 h-16" />,
          title: caseStudyData.title,
          result: caseStudyData.headline,
          challenge: caseStudyData.challenges,
          solution: caseStudyData.failures,
          overview: caseStudyData.overview,
          heroImage: caseStudyData.cover_image || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200',
          color: 'from-blue-600 to-purple-600'
        };
        
        setStudy(mappedStudy);
      } catch (error) {
        console.error('Error fetching case study:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCaseStudy();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!study) {
    return <div>Case study not found</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Hero Section with Image */}
      <div className="relative h-[50vh] sm:h-[60vh] lg:h-[70vh] overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${study.heroImage})` }}
        />
        <div className={`absolute inset-0 bg-gradient-to-r ${study.color} opacity-85`} />
        <div className="absolute inset-0 bg-black/20" />
        
        {/* Floating geometric shapes - hidden on mobile */}
        <div className="hidden md:block absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse" />
        <div className="hidden md:block absolute bottom-40 left-10 w-24 h-24 bg-white/15 rounded-lg rotate-45 animate-bounce" />
        <div className="hidden lg:block absolute top-1/3 right-1/4 w-16 h-16 bg-white/20 rounded-full animate-ping" />
        
        <div className="relative z-10 container mx-auto px-4 sm:px-6 h-full flex items-center">
          <div className="w-full max-w-4xl">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center text-white/90 hover:text-white mb-6 sm:mb-8 transition-all hover:translate-x-1 bg-white/10 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-full text-sm sm:text-base"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              <span className="hidden sm:inline">Back to Case Studies</span>
              <span className="sm:hidden">Back</span>
            </button>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 text-white leading-tight">
              {study.title}
            </h1>
            {/* <p className="text-2xl text-white/90 mb-8 font-light">{study.client}</p> */}
            
            {/* <div className="flex flex-wrap gap-8 text-lg">
              <div className="flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <Calendar className="w-5 h-5 mr-3" />
                {study.duration}
              </div>
              <div className="flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <Users className="w-5 h-5 mr-3" />
                {study.teamSize}
              </div>
              <div className="flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <Target className="w-5 h-5 mr-3" />
                {study.industry}
              </div>
            </div> */}
          </div>
        </div>
        
        {/* Scroll indicator - hidden on mobile */}
        <div className="hidden sm:block absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative -mt-10 sm:-mt-16 lg:-mt-20 z-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            {/* Key Result - Floating Card */}
            <div className="relative mb-12 sm:mb-16 lg:mb-20">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl sm:rounded-3xl blur-xl opacity-20 animate-pulse" />
              <GlassCard className="relative p-6 sm:p-8 lg:p-12 border-2 border-white/30 shadow-2xl">
                <div className="absolute -top-6 sm:-top-8 left-1/2 transform -translate-x-1/2">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                    <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                </div>
                <div className="text-center mb-6 sm:mb-8">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 mt-3 sm:mt-4">Key Result</h2>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent px-2">
                    {study.result}
                  </p>
                </div>

                {/* Challenge & Solution with Illustrations */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mt-8 sm:mt-12">
                  {/* Challenge */}
                  <div className="relative">
                    <div className="hidden sm:block absolute -top-4 -left-4 w-full h-full bg-gradient-to-br from-red-100 to-orange-100 rounded-2xl sm:rounded-3xl opacity-50" />
                    <div className="relative p-4 sm:p-6 border-l-4 border-red-400 bg-white/50 rounded-xl sm:rounded-2xl">
                      <div className="flex items-center mb-3 sm:mb-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-red-400 to-orange-400 rounded-lg sm:rounded-xl flex items-center justify-center mr-2 sm:mr-3">
                          <Target className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">The Challenge</h3>
                      </div>
                      <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{study.challenge}</p>
                      
                      {/* Decorative elements - hidden on mobile */}
                      <div className="hidden sm:block absolute top-4 right-4 w-12 h-12 lg:w-16 lg:h-16 bg-red-100 rounded-full opacity-30" />
                      <div className="hidden sm:block absolute bottom-4 right-6 w-6 h-6 lg:w-8 lg:h-8 bg-orange-100 rounded-lg opacity-40 rotate-12" />
                    </div>
                  </div>

                  {/* Solution */}
                  <div className="relative">
                    <div className="hidden sm:block absolute -top-4 -right-4 w-full h-full bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl sm:rounded-3xl opacity-50" />
                    <div className="relative p-4 sm:p-6 border-l-4 border-blue-400 bg-white/50 rounded-xl sm:rounded-2xl">
                      <div className="flex items-center mb-3 sm:mb-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-lg sm:rounded-xl flex items-center justify-center mr-2 sm:mr-3">
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Our Solution</h3>
                      </div>
                      <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{study.solution}</p>
                      
                      {/* Decorative elements - hidden on mobile */}
                      <div className="hidden sm:block absolute top-4 right-4 w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-full opacity-30" />
                      <div className="hidden sm:block absolute bottom-4 right-4 w-5 h-5 lg:w-6 lg:h-6 bg-cyan-100 rounded-full opacity-40" />
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Project Overview with Text Content */}
            <GlassCard className="p-6 sm:p-8 lg:p-12">
              <div className="text-center mb-8 sm:mb-12">
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Project Overview</h3>
                <div className="w-16 sm:w-20 lg:w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto rounded-full" />
              </div>
              
              <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none">
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-100">
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                    {study.overview}
                  </p>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseStudyDetail;
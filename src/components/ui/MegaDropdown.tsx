import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { trackBrowseEngagement } from '@/services/recommendationEngine';

interface BusinessObjective {
  id: number;
  name: string;
  function_id: number;
  is_active: boolean;
  description?: string;
}

interface Functionality {
  id: number;
  display_name: string;
  option_value: string;
  is_active: number;
}

interface MegaDropdownProps {
  className?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const MegaDropdown: React.FC<MegaDropdownProps> = ({ className }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [functionalities, setFunctionalities] = useState<Functionality[]>([]);
  const [businessObjectives, setBusinessObjectives] = useState<BusinessObjective[]>([]);
  const [selectedFunctionality, setSelectedFunctionality] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isMobile]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async () => {
    if (functionalities.length > 0) return;
    
    setLoading(true);
    console.log('Fetching dropdown data from:', API_BASE_URL);
    console.log('Full API URLs:', {
      functionalities: `${API_BASE_URL}/api/functionalities`,
      objectives: `${API_BASE_URL}/api/business-objectives`
    });
    
    // Set fallback data immediately
    const fallbackFunctionalities = [
      { id: 23, display_name: 'Business Development, Strategy & Growth', option_value: 'business_Development_strategy', is_active: 1 },
      { id: 24, display_name: 'HR & Workforce Solutions', option_value: 'hr_solutions', is_active: 1 },
      { id: 29, display_name: 'Digital Transformation & IT', option_value: 'digital_transformation', is_active: 1 },
      { id: 27, display_name: 'Marketing & Brand Positioning', option_value: 'marketing_brand', is_active: 1 },
      { id: 28, display_name: 'Financial & Risk Advisory', option_value: 'financial_advisory', is_active: 1 }
    ];
    
    const fallbackObjectives = [
      { id: 1, name: 'Strategic Planning', function_id: 23, is_active: true },
      { id: 2, name: 'Market Analysis', function_id: 23, is_active: true },
      { id: 3, name: 'Business Model Innovation', function_id: 23, is_active: true },
      { id: 4, name: 'Talent Acquisition', function_id: 24, is_active: true },
      { id: 5, name: 'Employee Engagement', function_id: 24, is_active: true },
      { id: 6, name: 'Training & Development', function_id: 24, is_active: true },
      { id: 7, name: 'Technology Strategy', function_id: 29, is_active: true },
      { id: 8, name: 'System Integration', function_id: 29, is_active: true },
      { id: 9, name: 'Data Analytics', function_id: 29, is_active: true },
      { id: 10, name: 'Brand Development', function_id: 27, is_active: true },
      { id: 11, name: 'Digital Marketing', function_id: 27, is_active: true },
      { id: 12, name: 'Customer Engagement', function_id: 27, is_active: true },
      { id: 13, name: 'Financial Planning', function_id: 28, is_active: true },
      { id: 14, name: 'Risk Assessment', function_id: 28, is_active: true },
      { id: 15, name: 'Compliance Management', function_id: 28, is_active: true }
    ];
    
    try {
      const [functionalitiesRes, objectivesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/functionalities`),
        fetch(`${API_BASE_URL}/api/business-objectives`)
      ]);

      console.log('Functionalities response:', functionalitiesRes.status, functionalitiesRes.ok);
      console.log('Objectives response:', objectivesRes.status, objectivesRes.ok);
      
      if (!functionalitiesRes.ok) {
        console.error('Functionalities API error:', await functionalitiesRes.text());
      }
      if (!objectivesRes.ok) {
        console.error('Objectives API error:', await objectivesRes.text());
      }

      let fetchedFunctionalities = fallbackFunctionalities;
      let fetchedObjectives = fallbackObjectives;

      if (functionalitiesRes.ok) {
        const functionalitiesData = await functionalitiesRes.json();
        console.log('Functionalities data:', functionalitiesData);
        if (functionalitiesData.success && functionalitiesData.data.length > 0) {
          console.log('Raw functionalities data:', functionalitiesData.data);
          console.log('Sample functionality:', functionalitiesData.data[0]);
          fetchedFunctionalities = functionalitiesData.data;
          console.log('Using API functionalities:', fetchedFunctionalities);
        }
      }

      if (objectivesRes.ok) {
        const objectivesData = await objectivesRes.json();
        console.log('Objectives data:', objectivesData);
        if (objectivesData.success && objectivesData.data.length > 0) {
          fetchedObjectives = objectivesData.data.filter((obj: BusinessObjective) => obj.is_active);
          console.log('Using API objectives:', fetchedObjectives);
        }
      }
      
      setFunctionalities(fetchedFunctionalities);
      setBusinessObjectives(fetchedObjectives);
      
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      // Use fallback data on error
      setFunctionalities(fallbackFunctionalities);
      setBusinessObjectives(fallbackObjectives);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchData();
    }
  };

  const getObjectivesForFunction = (functionId: number) => {
    return businessObjectives.filter(obj => obj.function_id === functionId);
  };

  const handleFunctionalityClick = (functionId: number) => {
    if (isMobile) {
      setSelectedFunctionality(selectedFunctionality === functionId ? null : functionId);
    }
  };

  const handleFunctionalityHover = (functionId: number) => {
    if (!isMobile) {
      setSelectedFunctionality(functionId);
    }
  };

  const handleObjectiveClick = (functionalityId: number, objectiveId: number) => {
    setIsOpen(false);
    
    // Check if user is authenticated
    const userData = localStorage.getItem('user');
    const isAuthenticated = userData && userData !== 'null';
    
    // Navigate to appropriate expert list based on authentication status
    if (isAuthenticated) {
      void trackBrowseEngagement(functionalityId);
      navigate(`/expertlist?functionality_id=${functionalityId}&objective_id=${objectiveId}&status=approved`);
    } else {
      navigate(`/experts-public?functionality_id=${functionalityId}&objective_id=${objectiveId}&status=approved`);
    }
  };

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="flex items-center gap-1 text-[11px] lg:text-sm font-medium text-foreground/80 hover:text-foreground 
          transition-colors whitespace-nowrap px-1.5 md:px-2 lg:px-3 py-0.5 hover:bg-gray-50/50 rounded-sm"
      >
        Browse
        <ChevronDown className={cn("h-3 w-3 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="fixed md:absolute top-16 md:top-full left-2 md:left-0 right-2 md:right-auto mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50
          md:w-[80vw] lg:w-[70vw] xl:w-[60vw] md:max-w-5xl 
          md:-translate-x-0 
          animate-in fade-in slide-in-from-top-2 duration-200">
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading...</p>
            </div>
          ) : (
            <div className={cn(
              "flex",
              isMobile ? "flex-col max-h-[70vh] overflow-y-auto" : "min-h-[300px] sm:min-h-[350px] lg:min-h-[400px]"
            )}>
              {/* Left Panel - Functionalities */}
              <div className={cn(
                "border-r border-gray-200 bg-gray-50/50",
                isMobile ? "border-r-0 border-b" : "w-full sm:w-2/5 md:w-1/3"
              )}>
                <div className="p-3 sm:p-4">
                  <h3 className="font-semibold text-xs sm:text-sm text-gray-900 mb-2 sm:mb-3">Categories</h3>
                  <div className="space-y-1">
                    {functionalities.length === 0 ? (
                      <div className="text-sm text-gray-500 p-2">
                        No categories available
                      </div>
                    ) : (
                      functionalities.map((func) => (
                      <div
                        key={func.id}
                        className={cn(
                          "p-1.5 sm:p-2 rounded-md cursor-pointer transition-colors text-xs sm:text-sm",
                          selectedFunctionality === func.id 
                            ? "bg-blue-50 text-blue-700 border-l-2 border-blue-500" 
                            : "hover:bg-gray-100 text-gray-700"
                        )}
                        onClick={() => handleFunctionalityClick(func.id)}
                        onMouseEnter={() => handleFunctionalityHover(func.id)}
                      >
                        <div className="flex items-center justify-between">
                          <span>{func.display_name}</span>
                          {isMobile && (
                            <ChevronRight className={cn(
                              "h-4 w-4 transition-transform",
                              selectedFunctionality === func.id && "rotate-90"
                            )} />
                          )}
                        </div>
                        
                        {/* Mobile Accordion Content */}
                        {isMobile && selectedFunctionality === func.id && (
                          <div className="mt-2 pl-2 border-l-2 border-blue-200 bg-blue-50/30 rounded-r">
                            {getObjectivesForFunction(func.id).length > 0 ? (
                              getObjectivesForFunction(func.id).map((objective) => (
                                <div
                                  key={objective.id}
                                  className="py-2 px-2 text-xs text-gray-700 hover:text-blue-700 cursor-pointer
                                    hover:bg-blue-100/50 rounded transition-colors"
                                  onClick={() => handleObjectiveClick(func.id, objective.id)}
                                >
                                  <div className="font-medium">{objective.name}</div>
                                </div>
                              ))
                            ) : (
                              <div className="py-2 px-2 text-xs text-gray-500">
                                No services available
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right Panel - Business Objectives (Desktop Only) */}
              {!isMobile && (
                <div className="flex-1 p-4">
                  {selectedFunctionality ? (
                    <div>
                      <h3 className="font-semibold text-sm text-gray-900 mb-3">
                        {functionalities.find(f => f.id === selectedFunctionality)?.display_name} Services
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {getObjectivesForFunction(selectedFunctionality).length > 0 ? (
                          getObjectivesForFunction(selectedFunctionality).map((objective) => (
                            <div
                              key={objective.id}
                              className="p-3 rounded-md hover:bg-blue-50 cursor-pointer border border-gray-100
                                hover:border-blue-200 transition-all duration-200 group hover:shadow-sm"
                              onClick={() => handleObjectiveClick(selectedFunctionality, objective.id)}
                            >
                              <div className="text-sm font-medium text-gray-900 group-hover:text-blue-700">
                                {objective.name}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-2 p-4 text-center text-gray-500 text-sm">
                            No services available for this category
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center p-8">
                        <div className="text-4xl mb-3">🔍</div>
                        <p className="text-sm font-medium mb-2">Explore Our Services</p>
                        <p className="text-xs text-gray-400">Hover over a category to see available services</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MegaDropdown;
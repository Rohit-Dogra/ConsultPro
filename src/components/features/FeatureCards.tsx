import React, { useState, useEffect } from 'react';
import GlassCard from "@/components/ui/GlassCard";
import { ArrowRight, TrendingUp, Users, Award, Building2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { caseStudyApi, type CaseStudy } from '../../services/caseStudyApi';
import { useToast } from "@/hooks/use-toast";

const iconMap = [TrendingUp, Users, Award, Building2];
const colorMap = [
	{ color: "from-blue-500 to-cyan-500", badgeColor: "bg-blue-100 text-blue-700", badge: "Technology" },
	{ color: "from-green-500 to-emerald-500", badgeColor: "bg-green-100 text-green-700", badge: "Strategy" },
	{ color: "from-purple-500 to-violet-500", badgeColor: "bg-purple-100 text-purple-700", badge: "Operations" },
	{ color: "from-orange-500 to-red-500", badgeColor: "bg-orange-100 text-orange-700", badge: "Innovation" },
	{ color: "from-pink-500 to-rose-500", badgeColor: "bg-pink-100 text-pink-700", badge: "Marketing" },
	{ color: "from-indigo-500 to-blue-600", badgeColor: "bg-indigo-100 text-indigo-700", badge: "Analytics" },
	{ color: "from-teal-500 to-green-600", badgeColor: "bg-teal-100 text-teal-700", badge: "Growth" },
	{ color: "from-amber-500 to-yellow-500", badgeColor: "bg-amber-100 text-amber-700", badge: "Finance" },
	{ color: "from-slate-500 to-gray-600", badgeColor: "bg-slate-100 text-slate-700", badge: "Consulting" },
	{ color: "from-emerald-500 to-teal-500", badgeColor: "bg-emerald-100 text-emerald-700", badge: "Sustainability" }
];

const FeatureCards = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const { toast } = useToast();
	const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
	const [loading, setLoading] = useState(true);

	const isHomePage = location.pathname === '/';
	const displayedStudies = isHomePage ? caseStudies.slice(0, 4) : caseStudies;

	useEffect(() => {
		const fetchCaseStudies = async () => {
			try {
				setLoading(true);
				let studies = await caseStudyApi.getAllCaseStudies();
				
				if (studies.length === 0) {
					console.log('No case studies found, seeding database...');
					await caseStudyApi.seedDatabase();
					studies = await caseStudyApi.getAllCaseStudies();
				}
				
				setCaseStudies(studies);
			} catch (error) {
				console.error('Error fetching case studies:', error);
			} finally {
				setLoading(false);
			}
		};
		
		fetchCaseStudies();
	}, []);

	const handleViewCaseStudy = async (id: string) => {
		try {
			// Check if user is logged in
			const userData = localStorage.getItem('user');
			if (!userData) {
				toast({
					title: "Authentication Required",
					description: "Please log in to continue.",
					variant: "destructive"
				});
				navigate('/auth/seeker');
				return;
			}

			const user = JSON.parse(userData);
			const userId = user.id || user.user_id;

			// Fetch user details from database to check role and subscription status
			const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${userId}`, {
				headers: {
					'Authorization': `Bearer ${user.token}`
				}
			});

			if (!response.ok) {
				throw new Error('Failed to fetch user details');
			}
            
			const userDetails = await response.json();
            
			// Check if user is a solution seeker
			if (userDetails.role !== 'solution_seeker') {
				toast({
                   title: "You're in the Right Place",
                   description: "Case studies are available for solution seekers. Please explore your expert tools and opportunities.",
                   variant: "default"
                     });
				return;
			}
            
			// Check if subscription is active or trial
			if (userDetails.subscription_status !== 'active' && userDetails.subscription_status !== 'trial') {
				toast({
					title: "Subscription Required",
					description: "Your subscription is inactive. Please subscribe to view case studies.",
					variant: "destructive"
				});
				navigate('/subscription-plans');
				return;
			}
            
			// If all checks pass, navigate to case study
			window.scrollTo({ top: 0, behavior: 'smooth' });
			navigate(`/case-study/${id}`);

		} catch (error) {
			console.error('Error checking user access:', error);
			toast({
				title: "Error",
				description: "Failed to verify access. Please try again.",
				variant: "destructive"
			});
		}
	};

	return (
		<section id="case-studies" className="section-container relative py-12">
			<div className="text-center mb-8">
				<span className="badge badge-green mb-4 text-2xl">Case Studies</span>
				<h2 className="section-title">
					Where <span className="text-gradient">Expertise</span> Transforms Into Results.
				</h2>
				<p className="section-subtitle mx-auto">
					Discover how our expert consultations have transformed businesses across industries.
				</p>
			</div>
            
			{loading ? (
				<div className="text-center py-12">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading case studies...</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					{displayedStudies.map((study, index) => {
						const IconComponent = iconMap[index % iconMap.length];
						const colorScheme = colorMap[index % colorMap.length];
						
						return (
							<div
								key={study.id}
								className="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-2 animate-fade-in"
								style={{ animationDelay: `${index * 100 + 300}ms` }}
							>
								{/* Gradient Header */}
								<div className={`h-24 bg-gradient-to-r ${colorScheme.color} relative overflow-hidden`}>
									<div className="absolute inset-0 bg-black/10"></div>
									{/* <div className="absolute top-4 left-4">
										<span className={`px-3 py-1 rounded-full text-xs font-medium ${colorScheme.badgeColor}`}>
											{colorScheme.badge}
										</span>
									</div> */}
									{/* <div className="absolute bottom-4 right-4 text-white/80">
										<IconComponent className="w-8 h-8" />
									</div> */}
									{/* Decorative Pattern */}
									<div className="absolute -top-4 -right-4 w-16 h-16 bg-white/10 rounded-full"></div>
									<div className="absolute -bottom-2 -left-2 w-12 h-12 bg-white/10 rounded-full"></div>
								</div>
                                
								{/* Content */}
								<div className="p-6">
									<h3 className="text-lg font-display font-bold mb-2 text-gray-900 group-hover:text-gray-700 transition-colors">
										{study.title}
									</h3>

									<div className="mb-4">
										<p className="text-sm font-bold text-gray-900 bg-gray-50 rounded-lg px-3 py-2">
											{study.headline}
										</p>
									</div>
                                    
									<button 
										onClick={() => {
											window.scrollTo({ top: 0, behavior: 'smooth' });
											handleViewCaseStudy(study.id);
										}}
										className="flex items-center text-sm font-semibold text-gray-700 hover:text-gray-900 group/btn transition-all"
									>
										View Case Study
										<ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
									</button>
								</div>

								{/* Hover Effect Overlay */}
								<div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
							</div>
						);
					})}
				</div>
			)}

			{/* View More Button - Only show on home page */}
			{isHomePage && (
				<div className="text-center mt-8">
					<button
						onClick={() => {
							window.scrollTo({ top: 0, behavior: 'smooth' });
							navigate('/features');
						}}
						className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
					>
						View More Case Studies
						<ArrowRight className="ml-2 w-5 h-5" />
					</button>
				</div>
			)}
		</section>
	);
};

export default FeatureCards;

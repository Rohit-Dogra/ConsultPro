import { useState } from "react";
import GlassCard from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import { PlayCircle, Video, Sparkles, UserCircle2, Users2 } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const expertVideos = [
  {
    id: "expert-signup",
    label: "Expert Signup Tutorial",
    description: "Learn the expert signup process step-by-step.",
    icon: <Video className="w-5 h-5" />,
    url: "https://www.youtube.com/embed/y4iCtAeFz0E",
    youtubeLink: "https://youtu.be/y4iCtAeFz0E?si=Zb8JD5vRCLA__YNe",
  },
  {
    id: "expert-profile",
    label: "Expert Profile Completion",
    description: "A guide to completing your expert profile effectively.",
    icon: <PlayCircle className="w-5 h-5" />,
    url: "https://www.youtube.com/embed/vsv2RcIf508",
    youtubeLink: "https://youtu.be/vsv2RcIf508?si=OSY14YQnaXm9xy0a",
  },
  {
    id: "Expert-Dashboard",
    label: "Expert-Dashboard Tutorial",
    description: "View your profile, manage upcoming meetings, and update availability and pricing.",
    icon: <Video className="w-5 h-5" />,
    url: "https://www.youtube.com/embed/aCTSN_NLgOw",
    youtubeLink: "https://youtu.be/aCTSN_NLgOw?si=dOo4mJBkO6irFP5t",
  },
];

const seekerVideos = [
  {
    id: "seeker-signup",
    label: "Seeker Signup Tutorial", 
    description: "Learn how to register as a solution seeker.",
    icon: <Video className="w-5 h-5" />,
    url: "https://www.youtube.com/embed/VVmeHcbmc_M",
    youtubeLink: "https://youtu.be/VVmeHcbmc_M?si=vbdanMhuBv52evu0",
  },
  //  {
  //   id: "Seeker Profile Form",
  //   label: "Solution-Seeker  Profile Completion",
  //   description: "A guide to completing your Solution-Seeker profile effectively.",
  //   icon: <PlayCircle className="w-5 h-5" />,
  //   url: "https://www.youtube.com/embed/your-booking-video",
  //   youtubeLink: "https://youtu.be/your-booking-video",
  // },
  //  {
  //   id: "Seeker-Dashboard",
  //   label: "Solution-Seeker -Dashboard Tutorial",
  //   description: "View your profile, schedule meetings with expert's.",
  //   icon: <Video className="w-5 h-5" />,
  //   url: "https://www.youtube.com/embed/seekr dashboard",
  //   youtubeLink: "https://youtu.be/aCTSN_NLgOw?si=dOo4mJBkO6irFP5t",
  // },
  // {
  //   id: "booking-session",
  //   label: "How to Book a Session",
  //   description: "Step-by-step guide to book a session with an expert.",
  //   icon: <PlayCircle className="w-5 h-5" />,
  //   url: "https://www.youtube.com/embed/your-booking-video",
  //   youtubeLink: "https://youtu.be/your-booking-video",
  // },
  // Add more seeker videos as needed
];

const FAQ_CATEGORIES = [
  {
    category: "General",
    icon: <Sparkles className="w-5 h-5 text-blue-500 mr-2" />,
    faqs: [
      { q: "What is Expertise Station?", a: "Expertise Station is a platform connecting experts with those seeking solutions, offering practical, solution-focused problem-solving." },
      { q: "How do I join?", a: "Register on the platform and follow the onboarding steps." },
      { q: "Is my data secure?", a: "Yes, we use secure authentication and encrypted storage for your data." },
      { q: "How do I contact support?", a: "Use the Contact page or the support email provided in the footer." },
      { q: "What types of sessions are available?", a: "Currently, we offer audio consultation sessions between seekers and experts." },
    ]
  },
  {
    category: "Expert",
    icon: <UserCircle2 className="w-5 h-5 text-green-500 mr-2" />,
    faqs: [
      { q: "How do I become an expert?", a: "Sign up as an expert and complete your profile. You’ll need to provide your expertise, experience, and other required details." },
      { q: "How do I get paid?", a: "Payments are processed through your linked account after each session is completed and confirmed." },
      { q: "Can I set my own availability?", a: "Yes, you can manage your available slots from your dashboard." },
      { q: "How do I handle session requests?", a: "You’ll receive notifications for new session requests. Accept or reschedule them from your dashboard." },
      { q: "What if a seeker doesn’t show up?", a: "If a seeker misses a session, you can mark it as a no-show and provide feedback." },
      { q: "How do I update my profile?", a: "Go to your dashboard and select ‘Edit Profile’ to update your information." },
    ]
  },
  {
    category: "Seeker",
    icon: <Users2 className="w-5 h-5 text-purple-500 mr-2" />,
    faqs: [
      { q: "How do I book a session?", a: "Browse experts and book a session from their profile. Select a date, time, and session type." },
      { q: "How do I pay for a session?", a: "After booking, you’ll be redirected to the payment page. Complete the payment to confirm your session." },
      { q: "What if my payment fails?", a: "If your payment fails, you can retry from the payment page or contact support for help." },
      { q: "How do I join a session?", a: "At the scheduled time, go to your dashboard and click ‘Join Session.’" },
      { q: "Can I give feedback after a session?", a: "Yes, after your session, you’ll be prompted to rate and review your experience." },
    ]
  },
];

const VideoVisualization = ({ activeCategory }: { activeCategory: string }) => {
  const video = [...expertVideos, ...seekerVideos].find(c => c.id === activeCategory);

  if (!video) return null;

  return (
    <div className="h-80 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-2 relative overflow-hidden flex items-center justify-center">
      <iframe
        width="100%"
        height="100%"
        src={video.url}
        title={video.label}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="rounded-lg shadow-lg"
      ></iframe>
    </div>
  );
};

const WatchAndLearn = () => {
  const [activeSection, setActiveSection] = useState<'expert' | 'seeker'>('expert');
  const [activeCategory, setActiveCategory] = useState(expertVideos[0].id);
  const navigate = useNavigate();

  const handleAllVideosClick = () => {
    navigate('/faq-videos');
  };
  
  const currentVideos = activeSection === 'expert' ? expertVideos : seekerVideos;
  const activeVideo = currentVideos.find(c => c.id === activeCategory);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <Navbar />
      <main className="flex-1">
        <section id="watch-and-learn" className="section-container relative">
          <div className="text-center mb-16">
            <span className="badge badge-blue mb-4">Tutorials</span>
            <h2 className="section-title">
              Watch & <span className="text-gradient">Learn</span>
            </h2>
            <p className="section-subtitle mx-auto">
              Step-by-step video guides to help you get the most out of our platform.
            </p>
          </div>

          {/* Section Toggle Buttons */}
          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={() => {
                setActiveSection('expert');
                setActiveCategory(expertVideos[0].id);
              }}
              className={cn(
                "px-6 py-3 rounded-lg font-medium transition-all",
                activeSection === 'expert'
                  ? "bg-primary text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              )}
            >
              Expert Tutorials
            </button>
            <button
              onClick={() => {
                setActiveSection('seeker');
                setActiveCategory(seekerVideos[0].id);
              }}
              className={cn(
                "px-6 py-3 rounded-lg font-medium transition-all",
                activeSection === 'seeker'
                  ? "bg-primary text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              )}
            >
              Solution-Seeker Tutorials
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2">
              <GlassCard className="p-6">
                <h3 className="text-xl font-display font-semibold mb-6">
                  {activeSection === 'expert' ? 'Expert Tutorials' : 'Solution-Seeker Tutorials'}
                </h3>
                <div className="space-y-4">
                  {currentVideos.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={cn(
                        "w-full text-left p-4 rounded-lg transition-all flex items-start",
                        activeCategory === category.id
                          ? "bg-primary/10 border-l-4 border-primary"
                          : "hover:bg-secondary"
                      )}
                    >
                      <div className={cn(
                        "mr-4 p-2 rounded-lg",
                        activeCategory === category.id ? "bg-primary text-white" : "bg-secondary"
                      )}>
                        {category.icon}
                      </div>
                      <div>
                        <h4 className="font-medium">{category.label}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {category.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </GlassCard>
            </div>
            
            <div className="lg:col-span-3">
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-display font-semibold">
                    {activeVideo?.label}
                  </h3>
                </div>
                <VideoVisualization activeCategory={activeCategory} />
                <div className="mt-6">
                  <h4 className="font-medium mb-2">Details</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-primary mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{activeVideo?.description}</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-primary mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      <a href={activeVideo?.youtubeLink} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        Watch on YouTube
                      </a>
                    </li>
                  </ul>
                </div>
                  
              </GlassCard>
            </div>
          </div>
          {/* FAQ Section */}
          <section id="faq-section" className="mt-20">
            <div className="flex flex-col items-center mb-10 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm mb-2 shadow-sm animate-bounce-slow">
                <Sparkles className="w-5 h-5 text-blue-500 animate-spin-slow" />
                FAQs
              </div>
              <h3 className="text-3xl md:text-4xl font-extrabold text-blue-800 mb-2 tracking-tight text-center drop-shadow-lg animate-fade-in-up">Frequently Asked Questions</h3>
              <p className="text-lg text-muted-foreground text-center max-w-2xl animate-fade-in-up delay-100">Find quick answers to common questions about our platform, experts, and seekers.</p>
            </div>
            <div className="max-w-3xl mx-auto grid gap-8">
              {FAQ_CATEGORIES.map((cat, idx) => (
                <div key={cat.category} className="rounded-2xl bg-white/80 shadow-xl border border-blue-100 p-0 overflow-hidden animate-fade-in-up" style={{animationDelay: `${idx * 80}ms`}}>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value={cat.category}>
                      <AccordionTrigger className="flex items-center gap-2 px-6 py-4 text-lg font-semibold hover:bg-blue-50 transition-all">
                        {cat.icon}
                        {cat.category}
                      </AccordionTrigger>
                      <AccordionContent className="bg-blue-50/60 px-4 pb-4">
                        <Accordion type="single" collapsible className="w-full">
                          {cat.faqs.map((faq, i) => (
                            <AccordionItem value={faq.q} key={faq.q}>
                              <AccordionTrigger className="flex items-center gap-2 px-2 py-3 text-base font-medium rounded hover:bg-blue-100 transition-all">
                                <span className="w-2 h-2 rounded-full bg-blue-400 inline-block mr-2 animate-pulse"></span>
                                {faq.q}
                              </AccordionTrigger>
                              <AccordionContent className="px-4 py-2 text-gray-700 animate-fade-in">
                                {faq.a}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              ))}
            </div>
            <style>{`
              @keyframes fade-in {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: none; }
              }
              .animate-fade-in { animation: fade-in 0.7s cubic-bezier(.4,0,.2,1) both; }
              .animate-fade-in-up { animation: fade-in 0.8s cubic-bezier(.4,0,.2,1) both; }
              @keyframes bounce-slow {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-6px); }
              }
              .animate-bounce-slow { animation: bounce-slow 2.2s infinite; }
              @keyframes spin-slow {
                100% { transform: rotate(360deg); }
              }
              .animate-spin-slow { animation: spin-slow 2.5s linear infinite; }
              @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
              }
              .animate-pulse { animation: pulse 1.5s infinite; }
            `}</style>
          </section>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default WatchAndLearn;
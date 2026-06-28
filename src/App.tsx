import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Toaster as HotToaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import Index from "./pages/Index";
import Notifications from "./pages/Notifications";
import Network from "./pages/Network";
import Products from "./pages/Products";
import Features from "./pages/Features";
import Insights from "./pages/Insights";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import ExpertProfile from "./pages/ExpertProfile";
import SeekerForm from "./components/Auth/SeekerForm";
import ExpertForm from "./components/Auth/ExpertForm";
import ExpertProfileForm from "./components/Auth/ExpertProfileForm";
import SeekerProfileForm from "./components/Auth/SeekerProfileForm";
import Webinar from "./pages/Webinar";
import ExpertDashboard from "./components/dashboard/ExpertDashboard";
import About from "./components/About/About";
import WebinarSection from "./components/webinar/WebinarSection";
import ProductShowcase from "./components/products/ProductShowcase";
import Onboarding from "./pages/Onboarding";
import AIdashboard from "./pages/AIdashboard";
import SeekerDashboard from "./components/dashboard/SeekerDashbord";
import AppointmentLog from "./pages/Appointment_log";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import DataProcessing from "./pages/DataProcessing";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";
import RefundPolicy from "./pages/RefundPolicy";
import WalletPage from "./pages/WalletPage";
import Session from "./pages/Session";
import AudioSession from './pages/AudioSession';
import ExpertsList from "@/pages/ExpertsList";
import ResetPassword from './components/Auth/ResetPassword';
import Payments from "./pages/Payments";
import PaymentResponse from './pages/PaymentResponse';
import WatchAndLearn from "@/components/layout/WatchAndLearn";
import { CurrencyTimezoneProvider } from "./components/contexts/CurrencyTimezoneContext";
import CompanyPosts from './pages/CompanyPosts';
import PostDetail from './pages/PostDetail';
import AIChat from "./components/AIChat";
import Careers from './pages/Careers';
import CareersAdmin from './pages/CareersAdmin';
import GetStarted from "./components/Getstarted/GetStarted";
import CaseStudyDetail from "./components/CaseStudyDetail";
import ExpertsListPublic from "./pages/ExpertsListPublic";
import PricingPage from "./pages/PricingPage";
import BlogPlatform from "./pages/BlogPlatform";
import BlogDetails from "./pages/BlogDetails";
import SubscriptionPlans from "./pages/SubscriptionPlans";
import WhatsAppButton from "./components/ui/WhatsAppButton";
// import SubscriptionDebug from "./components/SubscriptionDebug";
// import AuthGuard from "./components/AuthGuard";

const queryClient = new QueryClient();
const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
      <Toaster />
      <Sonner />
      <HotToaster position="top-right" />
      <BrowserRouter>
       <CurrencyTimezoneProvider>
        <Routes>
          <Route path="/" element={<><Index /></>} />
          <Route path="/get-started" element={<><AIChat/><GetStarted /></>} />
          <Route path="/about" element={<><AIChat/><About /></>} />
          <Route path="/network" element={<><AIChat/><Network /></>} />
          <Route path="/experts/:id" element={<><AIChat/><ExpertProfile /></>} />
          <Route path="/expert-profile/:user_id" element={<><AIChat/><ExpertProfile /></>} />
          <Route path="/features" element={<><AIChat/><Features /></>} />
          <Route path="/insights" element={<><AIChat/><Insights /></>} />
          <Route path="/onboarding" element={<><AIChat/><Onboarding /></>} />
          <Route path="/aidashboard" element={<><AIChat/><AIdashboard /></>} />
          <Route path="/contact" element={<><AIChat/><Contact /></>} />
          <Route path="/auth/seeker" element={<><AIChat/><SeekerForm /></>} />
          <Route path="/auth/expert" element={<><AIChat/><ExpertForm /></>} />
          <Route path="/auth/ExpertProfileForm" element={<><AIChat/><ExpertProfileForm /></>} />
          <Route path="/auth/SeekerProfileForm" element={<><AIChat/><SeekerProfileForm /></>} />
          <Route path="/webinar" element={<><AIChat/><Webinar /></>} />
          <Route path="/webinarsection" element={<><AIChat/><WebinarSection /></>} />
          <Route path="/products" element={<><AIChat/><Products /></>} />
          <Route path="/productshowcase" element={<><AIChat/><ProductShowcase /></>} />
          <Route path="/dashboard" element={<><AIChat/><ExpertDashboard /></>} />
          <Route path="/seekerdashboard" element={<><AIChat/><SeekerDashboard /></>} />
          <Route path="/appointment-log" element={<><AIChat/><AppointmentLog /></>} />
          <Route path="/privacypolicy" element={<PrivacyPolicy />} />
          <Route path="/dataprocessing" element={<DataProcessing />} />
          <Route path="/termofservice" element={<TermsOfService />} />
          <Route path="/cookiepolicy" element={<CookiePolicy />} />
          <Route path="/refundpolicy" element={<RefundPolicy />} />
          <Route path="/wallet" element={<><AIChat/><WalletPage /></>} />
          <Route path="/payments" element={<><AIChat/><Payments /></>} />
          <Route path="/session/:id" element={<><AIChat/><Session /></>} />
          <Route path="/notifications" element={<><AIChat/><Notifications /></>} />
          <Route path="/audio-session/:id" element={<><AIChat/><AudioSession /></>} />
          <Route path="/experts" element={<><AIChat/><ExpertsList /></>} />
          <Route path="/expertlist" element={<><AIChat/><ExpertsList /></>} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/payment/response" element={<PaymentResponse />} />
          <Route path="/payment/success" element={<PaymentResponse />} />
          <Route path="/payment/failure" element={<PaymentResponse />} />
          <Route path="/tutorials" element={<><AIChat/><WatchAndLearn /></>} />
          <Route path="/company-posts" element={<><AIChat/><CompanyPosts /></>} />
          <Route path="/company-posts/:id" element={<PostDetail />} />
          <Route path="/careers" element={<><AIChat/><Careers /></>} />
          <Route path="/careers/admin" element={<><AIChat/><CareersAdmin /></>} />
          <Route path="/case-study/:id" element={<><AIChat/><CaseStudyDetail /></>} />
          <Route path="/experts-public" element={<><AIChat/><ExpertsListPublic /></>} />
          <Route path="/pricing" element={<><AIChat/><PricingPage /></>} />
          <Route path="/subscription-plans" element={<><AIChat/><SubscriptionPlans /></>} />
          <Route path="/payment-test" element={<><AIChat/><Payments /></>} />
          {/* <Route path="/subscription-debug" element={<><AIChat/><AuthGuard><SubscriptionDebug /></AuthGuard></> } /> */}
          <Route path="/blog" element={<><AIChat/><BlogPlatform /></>} />
          <Route path="/blog/:id" element={<><AIChat/><BlogDetails /></>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <WhatsAppButton/>
        </CurrencyTimezoneProvider>
      </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;


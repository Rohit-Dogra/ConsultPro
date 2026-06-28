import React from 'react';
import '../components/webinar/Webinar.css';
import Subhash from '@/img/webinar/Subhash.jpg'
import Fabrizio from '@/img/webinar/Fabrizio.jpg';
import Rajan from '@/img/webinar/Rajan.jpg';
import Prashant from '@/img/webinar/Prashant Bhatmule.jpg';
import Franco from '@/img/webinar/Franco Baraghini.jpg';
import Lalitendu from '@/img/webinar/Lalitendu Samanta.jpg';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

interface SpeakerProfile {
  name: string;
  title: string;
  experience: string;
  image: string;
  bio: string;
}

const speakers: SpeakerProfile[] = [
  {
    name: "Subhash Vashisht",
    title: "General Manager",
    experience: "37+ years Expertise: Medical Device Development & Manufacturing Operations",
    image: Subhash,
    bio: "A highly accomplished professional with over 37 years of expertise in Medical Device Development & Manufacturing Operations. Proven track record in leading strategic initiatives."
  },
  {
    name: "Fabrizio Righetti",
    title: "Chief Transformation Officer",
    experience: "20+ years Expertise: Business Turn-around",
    image: Fabrizio,
    bio: "A seasoned professional with over 20 years of expertise in business transformation and turn-around. Demonstrated success in leading organizations through complex change initiatives."
  },
  {
    name: "Rajan Wadhera",
    title: "Member-SCALE Committee-GOI",
    experience: "43+ years Expertise: Automotive & Farm Equipment",
    image: Rajan,
    bio: "A distinguished leader with over 43 years of expertise in automotive and farm equipment sectors. Strong history of driving innovation and growth through strategic leadership."
  },
  {
    name: "Prashant Bhatmula",
    title: "SCM, Sales & Marketing",
    experience: "35+ years Expertise: Supply Chain & Operations",
    image: Prashant,
    bio: "A seasoned professional with over 35 years of expertise in supply chain management and operations. Proven success in driving operational excellence and business growth."
  },
  {
    name: "Franco Baraghini",
    title: "CEO-Entrepreneur-Innovation",
    experience: "20+ years Expertise: Innovation & Entrepreneurship",
    image: Franco,
    bio: "A visionary leader with over 20 years of expertise in innovation and entrepreneurship. Demonstrated success in building businesses and driving growth through innovation."
  },
  {
    name: "Lalitendu Samanta",
    title: "Corporate Head HR",
    experience: "30+ years Expertise: Strategic HR & Operations",
    image: Lalitendu,
    bio: "A seasoned HR professional with over 30 years of expertise in strategic HR and operations. Proven track record in organizational development."
  }
];

const Webinar: React.FC = () => {
  const navigate =useNavigate();
  const handleRedirect = () => {
    window.scrollTo({ top:0, behavior: 'smooth'});
    navigate("/webinarsection");
  }
  return (
    <>
    <Navbar/>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mt-12">
        {/* Intro Section */}
        <section className="text-center mb-5 ">
          {/* <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Strategic Insights: Leadership Perspectives on Industry Transformation
          </h1> */}
          <h2 className="section-title">
          Strategic Insights: <span className="text-gradient"> Leadership Perspectives on Industry Transformation </span>
          </h2>
          <p className="section-subtitle text-xl text-gray-600 max-w-3xl mx-auto">
            Join our exclusive executive webinar featuring distinguished industry leaders and strategic consultants.
            Discover cutting-edge insights on business transformation, operational excellence, and strategic innovation.
            Connect with visionaries who have successfully navigated complex market challenges and driven organizational growth.
          </p>
        </section>

        {/* Speakers Section */}  
        <section className="mb-10">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-5">
            Meet Our Distinguished Speakers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {speakers.map((speaker) => (
              <div key={speaker.name} className="bg-white rounded-lg shadow-lg p-6 speaker-card">
                <div className="speaker-image-container">
                  <img
                    src={speaker.image}
                    alt={speaker.name}
                    className="rounded-full w-32 h-32 mx-auto object-cover"
                  />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 text-center speaker-name">
                  {speaker.name}
                </h3>
                <p className="text-gray-600 text-center mb-2 speaker-title">{speaker.title}</p>
                <p className="text-gray-500 text-sm text-center mb-3 speaker-experience">
                  {speaker.experience}
                </p>
                <p className="text-gray-700 text-center speaker-bio">{speaker.bio}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Video Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Webinar Preview
          </h2>
          <div className="mt-16 flex justify-center">
        <div className="w-[560px] h-[315px] max-w-4xl aspect-video">
          <iframe
            className="w-full h-full rounded-xl"
            src="https://www.youtube.com/embed/ZXJ8owtrWVM"
            title="Webinar Preview"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </div>
        </section>

        {/* Registration Button */}
        <section className="text-center">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-xl shadow-lg transform transition hover:scale-105"
            onClick={handleRedirect}
          >
            Register Now
          </button>
        </section>
      </div>
      <Footer/>
    </>
  );
};

export default Webinar;

// import React, { useState } from 'react';
// import { Menu, X, Heart, Shield, Calendar, MessageCircle, Award } from 'lucide-react';

// const LandingPage = ({ setCurrentView }) => {
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

//   return (
//     <div className="min-h-screen">
//       {/* Navbar */}
//       <nav className="bg-white/80 backdrop-blur-md shadow-lg fixed w-full z-50">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex justify-between items-center h-16">
//             <div className="flex items-center space-x-2">
//               <Heart className="w-8 h-8 text-purple-600" />
//               <span className="text-2xl font-bold bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
//                 Mentora
//               </span>
//             </div>

//             <div className="hidden md:flex items-center space-x-6">
//               <a href="#features" className="text-gray-700 hover:text-purple-600 transition">Features</a>
//               <a href="#how-it-works" className="text-gray-700 hover:text-purple-600 transition">How It Works</a>
//               <a href="#about" className="text-gray-700 hover:text-purple-600 transition">About</a>
//               <button 
//                 onClick={() => setCurrentView('login')} 
//                 className="text-purple-600 hover:text-purple-800 font-semibold"
//               >
//                 Login
//               </button>
//               <button 
//                 onClick={() => setCurrentView('doctor-register')} 
//                 className="bg-linear-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full hover:shadow-lg transform hover:scale-105 transition"
//               >
//                 Doctor Registration
//               </button>
//             </div>

//             <button 
//               onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
//               className="md:hidden"
//             >
//               {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
//             </button>
//           </div>
//         </div>

//         {mobileMenuOpen && (
//           <div className="md:hidden bg-white border-t">
//             <div className="px-4 py-4 space-y-3">
//               <a href="#features" className="block text-gray-700 hover:text-purple-600">Features</a>
//               <a href="#how-it-works" className="block text-gray-700 hover:text-purple-600">How It Works</a>
//               <a href="#about" className="block text-gray-700 hover:text-purple-600">About</a>
//               <button 
//                 onClick={() => setCurrentView('login')} 
//                 className="block w-full text-left text-purple-600 font-semibold"
//               >
//                 Login
//               </button>
//               <button 
//                 onClick={() => setCurrentView('doctor-register')} 
//                 className="block w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full"
//               >
//                 Doctor Registration
//               </button>
//             </div>
//           </div>
//         )}
//       </nav>

//       {/* Hero Section */}
//       <section className="pt-32 pb-20 px-4">
//         <div className="max-w-7xl mx-auto text-center">
//           <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-linear-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent animate-pulse">
//             Your Mental Wellness Journey Starts Here
//           </h1>
//           <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
//             AI-powered platform connecting you to the right mental health specialist. Get personalized care, at the right time.
//           </p>
//           <div className="flex flex-col sm:flex-row gap-4 justify-center">
//             <button 
//               onClick={() => setCurrentView('register')} 
//               className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-2xl transform hover:scale-105 transition"
//             >
//               Get Started Free
//             </button>
//             <button className="bg-white text-purple-600 px-8 py-4 rounded-full text-lg font-semibold border-2 border-purple-600 hover:bg-purple-50 transition">
//               Learn More
//             </button>
//           </div>
//         </div>
//       </section>

//       {/* Features Section */}
//       <section id="features" className="py-20 px-4 bg-white/50">
//         <div className="max-w-7xl mx-auto">
//           <h2 className="text-4xl font-bold text-center mb-16 text-gray-800">Why Choose Mentora?</h2>
//           <div className="grid md:grid-cols-3 gap-8">
//             {[
//               { 
//                 icon: Shield, 
//                 title: 'AI-Powered Routing', 
//                 desc: 'Our SRTS system analyzes your symptoms and severity to connect you with the right specialist', 
//                 color: 'from-purple-500 to-pink-500' 
//               },
//               { 
//                 icon: MessageCircle, 
//                 title: 'RAG Guidance', 
//                 desc: 'Personalized mental wellness advice and micro-therapy suggestions tailored to your needs', 
//                 color: 'from-blue-500 to-purple-500' 
//               },
//               { 
//                 icon: Calendar, 
//                 title: 'Seamless Booking', 
//                 desc: 'Book consultations, make payments, and join video calls - all in one secure platform', 
//                 color: 'from-pink-500 to-red-500' 
//               },
//               { 
//                 icon: Award, 
//                 title: 'Verified Specialists', 
//                 desc: 'Connect with certified counselors, psychologists, and psychiatrists', 
//                 color: 'from-green-500 to-teal-500' 
//               },
//               { 
//                 icon: Heart, 
//                 title: 'Mood Tracking', 
//                 desc: 'Track your mental wellness journey with personalized insights and treatment plans', 
//                 color: 'from-orange-500 to-pink-500' 
//               },
//               { 
//                 icon: Shield, 
//                 title: 'Privacy First', 
//                 desc: 'End-to-end encryption ensures your data remains completely confidential', 
//                 color: 'from-indigo-500 to-purple-500' 
//               }
//             ].map((feature, idx) => (
//               <div key={idx} className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition">
//                 <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4`}>
//                   <feature.icon className="w-8 h-8 text-white" />
//                 </div>
//                 <h3 className="text-xl font-bold mb-3 text-gray-800">{feature.title}</h3>
//                 <p className="text-gray-600">{feature.desc}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* How It Works */}
//       <section id="how-it-works" className="py-20 px-4">
//         <div className="max-w-7xl mx-auto">
//           <h2 className="text-4xl font-bold text-center mb-16 text-gray-800">How Mentora Works</h2>
//           <div className="grid md:grid-cols-4 gap-6">
//             {[
//               { step: '1', title: 'Sign Up', desc: 'Create your account in seconds' },
//               { step: '2', title: 'Assessment', desc: 'Complete our intelligent mood questionnaire' },
//               { step: '3', title: 'Get Matched', desc: 'AI routes you to the right specialist' },
//               { step: '4', title: 'Start Healing', desc: 'Begin your personalized treatment journey' }
//             ].map((item, idx) => (
//               <div key={idx} className="text-center">
//                 <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-3xl font-bold flex items-center justify-center mx-auto mb-4">
//                   {item.step}
//                 </div>
//                 <h3 className="text-xl font-bold mb-2 text-gray-800">{item.title}</h3>
//                 <p className="text-gray-600">{item.desc}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Footer */}
//       <footer className="bg-gray-900 text-white py-12 px-4">
//         <div className="max-w-7xl mx-auto text-center">
//           <div className="flex items-center justify-center space-x-2 mb-4">
//             <Heart className="w-8 h-8 text-purple-400" />
//             <span className="text-2xl font-bold">Mentora</span>
//           </div>
//           <p className="text-gray-400 mb-4">Guiding you to the right help, at the right time.</p>
//           <p className="text-gray-500 text-sm">© 2024 Mentora. All rights reserved.</p>
//         </div>
//       </footer>
//     </div>
//   );
// };

// export default LandingPage;


import React, { useState, useEffect } from 'react';
import { Heart, Sparkles, Brain, Shield, MessageCircle, Calendar, ChevronRight, Menu, X } from 'lucide-react';

const MentoraLanding = ({ setCurrentView }) => {
  const [scrollY, setScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle view changes - you can integrate this with your routing
  const handleViewChange = (view) => {
    if (setCurrentView) {
      setCurrentView(view);
    }
    setMobileMenuOpen(false);
    console.log(`Navigating to: ${view}`);
  };

  return (
    <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 min-h-screen">
      {/* Fixed Navigation */}
      <nav className="bg-white/70 backdrop-blur-xl shadow-lg fixed w-full z-50 border-b border-teal-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" fill="white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                Mentora
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-teal-600 transition font-medium">
                Features
              </a>
              <a href="#how-it-works" className="text-gray-700 hover:text-teal-600 transition font-medium">
                How It Works
              </a>
              <a href="#about" className="text-gray-700 hover:text-teal-600 transition font-medium">
                About
              </a>
              <button
                onClick={() => handleViewChange('login')}
                className="text-teal-600 hover:text-teal-700 font-semibold transition"
              >
                Login
              </button>
              <button
                onClick={() => handleViewChange('doctor-register')}
                className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-6 py-2 rounded-full hover:shadow-lg transform hover:scale-105 transition font-medium"
              >
                Doctor Registration
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-gray-700" /> : <Menu className="w-6 h-6 text-gray-700" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/90 backdrop-blur-xl border-t border-teal-100">
            <div className="px-4 py-4 space-y-3">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-700 hover:text-teal-600 py-2 font-medium"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-700 hover:text-teal-600 py-2 font-medium"
              >
                How It Works
              </a>
              <a
                href="#about"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-700 hover:text-teal-600 py-2 font-medium"
              >
                About
              </a>
              <button
                onClick={() => handleViewChange('login')}
                className="block w-full text-left text-teal-600 font-semibold py-2"
              >
                Login
              </button>
              <button
                onClick={() => handleViewChange('doctor-register')}
                className="block w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-6 py-3 rounded-full font-medium mt-2"
              >
                Doctor Registration
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 mb-8 border border-teal-200">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span className="text-sm font-medium text-teal-700">AI-Powered Mental Wellness</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                Your Mind
              </span>
              <br />
              <span className="text-gray-800">Deserves Care</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              Connect with verified mental health specialists through intelligent routing.
              Start your journey to wellness with personalized care.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => handleViewChange('register')}
                className="group bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-8 py-4 rounded-full font-semibold shadow-lg hover:shadow-xl transition transform hover:scale-105 flex items-center gap-2"
              >
                Start Your Journey
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition" />
              </button>
              <button className="bg-white/60 backdrop-blur-sm text-gray-700 px-8 py-4 rounded-full font-semibold border border-teal-200 hover:bg-white/80 transition">
                Watch Demo
              </button>
            </div>
          </div>

          {/* Floating Stats */}
          <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-3xl mx-auto mt-16">
            {[
              { value: '10k+', label: 'Users Helped' },
              { value: '500+', label: 'Specialists' },
              { value: '98%', label: 'Satisfaction' }
            ].map((stat, idx) => (
              <div key={idx} className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-teal-100 text-center hover:bg-white/80 transition">
                <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent mb-1">
                  {stat.value}
                </div>
                <div className="text-xs md:text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Everything You Need
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              A complete platform designed to make mental healthcare accessible and effective
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Brain,
                title: 'Smart Routing',
                desc: 'AI analyzes your needs and connects you with the perfect specialist',
                gradient: 'from-teal-400 to-emerald-400'
              },
              {
                icon: MessageCircle,
                title: 'Guided Support',
                desc: 'Personalized micro-therapy and wellness advice between sessions',
                gradient: 'from-emerald-400 to-cyan-400'
              },
              {
                icon: Calendar,
                title: 'Easy Booking',
                desc: 'Schedule sessions, make payments, and join video calls seamlessly',
                gradient: 'from-cyan-400 to-teal-400'
              },
              {
                icon: Shield,
                title: 'Verified Experts',
                desc: 'All specialists are certified and thoroughly verified',
                gradient: 'from-teal-400 to-emerald-400'
              },
              {
                icon: Heart,
                title: 'Mood Tracking',
                desc: 'Monitor your progress with insights and personalized treatment plans',
                gradient: 'from-emerald-400 to-cyan-400'
              },
              {
                icon: Shield,
                title: 'Privacy First',
                desc: 'End-to-end encryption keeps your data completely confidential',
                gradient: 'from-cyan-400 to-teal-400'
              }
            ].map((feature, idx) => (
              <div key={idx} className="group bg-white/60 backdrop-blur-sm rounded-3xl p-8 border border-teal-100 hover:bg-white/80 hover:shadow-xl transition transform hover:-translate-y-1">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Simple Steps to Wellness
            </h2>
            <p className="text-gray-600">Your journey starts in just four easy steps</p>
          </div>

          <div className="relative">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-teal-300 via-emerald-300 to-cyan-300 -translate-y-1/2 rounded-full"></div>

            <div className="grid md:grid-cols-4 gap-8 relative">
              {[
                { num: '01', title: 'Sign Up', desc: 'Create your secure account' },
                { num: '02', title: 'Assessment', desc: 'Complete mood questionnaire' },
                { num: '03', title: 'Get Matched', desc: 'AI finds your specialist' },
                { num: '04', title: 'Start Healing', desc: 'Begin personalized care' }
              ].map((step, idx) => (
                <div key={idx} className="relative">
                  <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 border border-teal-100 hover:bg-white/80 transition text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-400 text-white text-2xl font-bold flex items-center justify-center mx-auto mb-4 shadow-lg">
                      {step.num}
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{step.title}</h3>
                    <p className="text-sm text-gray-600">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 bg-white/40">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            About Mentora
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed mb-8">
            Mentora is an AI-powered mental health platform that connects individuals with verified mental health specialists.
            Our intelligent routing system ensures you get matched with the right professional based on your specific needs and severity assessment.
          </p>
          <p className="text-lg text-gray-600 leading-relaxed">
            We believe everyone deserves access to quality mental healthcare, and we're committed to making that journey
            as seamless and supportive as possible.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-500 rounded-[3rem] p-12 md:p-16 text-center text-white relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Ready to Start Your Journey?
              </h2>
              <p className="text-lg md:text-xl text-teal-50 mb-8 max-w-2xl mx-auto">
                Join thousands who've found the right support at the right time
              </p>
              <button
                onClick={() => handleViewChange('register')}
                className="bg-white text-teal-600 px-8 py-4 rounded-full font-semibold hover:shadow-2xl transition transform hover:scale-105"
              >
                Get Started Free
              </button>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-teal-100 bg-white/40">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" fill="white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                Mentora
              </span>
            </div>

            <div className="flex gap-8 text-sm text-gray-600">
              <a href="#" className="hover:text-teal-600 transition">Privacy</a>
              <a href="#" className="hover:text-teal-600 transition">Terms</a>
              <a href="#" className="hover:text-teal-600 transition">Contact</a>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500">© 2024 Mentora. All rights reserved.</p>
            <p className="text-sm text-gray-600 mt-2">Guiding you to the right help, at the right time.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MentoraLanding;
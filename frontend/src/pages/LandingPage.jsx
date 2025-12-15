
import React, { useState } from 'react';
import { Menu, X, Heart, Shield, Calendar, MessageCircle, Award } from 'lucide-react';

const LandingPage = ({ setCurrentView }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md shadow-lg fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Heart className="w-8 h-8 text-purple-600" />
              <span className="text-2xl font-bold bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Mentora
              </span>
            </div>
            
            <div className="hidden md:flex items-center space-x-6">
              <a href="#features" className="text-gray-700 hover:text-purple-600 transition">Features</a>
              <a href="#how-it-works" className="text-gray-700 hover:text-purple-600 transition">How It Works</a>
              <a href="#about" className="text-gray-700 hover:text-purple-600 transition">About</a>
              <button 
                onClick={() => setCurrentView('login')} 
                className="text-purple-600 hover:text-purple-800 font-semibold"
              >
                Login
              </button>
              <button 
                onClick={() => setCurrentView('doctor-register')} 
                className="bg-linear-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full hover:shadow-lg transform hover:scale-105 transition"
              >
                Doctor Registration
              </button>
            </div>

            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="md:hidden"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-4 py-4 space-y-3">
              <a href="#features" className="block text-gray-700 hover:text-purple-600">Features</a>
              <a href="#how-it-works" className="block text-gray-700 hover:text-purple-600">How It Works</a>
              <a href="#about" className="block text-gray-700 hover:text-purple-600">About</a>
              <button 
                onClick={() => setCurrentView('login')} 
                className="block w-full text-left text-purple-600 font-semibold"
              >
                Login
              </button>
              <button 
                onClick={() => setCurrentView('doctor-register')} 
                className="block w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full"
              >
                Doctor Registration
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-linear-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent animate-pulse">
            Your Mental Wellness Journey Starts Here
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            AI-powered platform connecting you to the right mental health specialist. Get personalized care, at the right time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => setCurrentView('register')} 
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-2xl transform hover:scale-105 transition"
            >
              Get Started Free
            </button>
            <button className="bg-white text-purple-600 px-8 py-4 rounded-full text-lg font-semibold border-2 border-purple-600 hover:bg-purple-50 transition">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-800">Why Choose Mentora?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: Shield, 
                title: 'AI-Powered Routing', 
                desc: 'Our SRTS system analyzes your symptoms and severity to connect you with the right specialist', 
                color: 'from-purple-500 to-pink-500' 
              },
              { 
                icon: MessageCircle, 
                title: 'RAG Guidance', 
                desc: 'Personalized mental wellness advice and micro-therapy suggestions tailored to your needs', 
                color: 'from-blue-500 to-purple-500' 
              },
              { 
                icon: Calendar, 
                title: 'Seamless Booking', 
                desc: 'Book consultations, make payments, and join video calls - all in one secure platform', 
                color: 'from-pink-500 to-red-500' 
              },
              { 
                icon: Award, 
                title: 'Verified Specialists', 
                desc: 'Connect with certified counselors, psychologists, and psychiatrists', 
                color: 'from-green-500 to-teal-500' 
              },
              { 
                icon: Heart, 
                title: 'Mood Tracking', 
                desc: 'Track your mental wellness journey with personalized insights and treatment plans', 
                color: 'from-orange-500 to-pink-500' 
              },
              { 
                icon: Shield, 
                title: 'Privacy First', 
                desc: 'End-to-end encryption ensures your data remains completely confidential', 
                color: 'from-indigo-500 to-purple-500' 
              }
            ].map((feature, idx) => (
              <div key={idx} className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-800">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-800">How Mentora Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'Sign Up', desc: 'Create your account in seconds' },
              { step: '2', title: 'Assessment', desc: 'Complete our intelligent mood questionnaire' },
              { step: '3', title: 'Get Matched', desc: 'AI routes you to the right specialist' },
              { step: '4', title: 'Start Healing', desc: 'Begin your personalized treatment journey' }
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-3xl font-bold flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-800">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Heart className="w-8 h-8 text-purple-400" />
            <span className="text-2xl font-bold">Mentora</span>
          </div>
          <p className="text-gray-400 mb-4">Guiding you to the right help, at the right time.</p>
          <p className="text-gray-500 text-sm">© 2024 Mentora. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
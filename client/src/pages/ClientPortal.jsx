import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { BACKEND_URL } from '../utils/api';
import { 
  CheckCircleIcon, 
  LockClosedIcon, 
  DocumentArrowUpIcon, 
  XMarkIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserIcon,
  GlobeAmericasIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  DocumentCheckIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

const VISA_TYPES = [
  { id: 'Study Visa / Student Permit', title: 'Study Visa', desc: 'University & College Admissions', icon: '🎓' },
  { id: 'Work Visa / Work Permit', title: 'Work Permit', desc: 'Job Offers & LMIA Sponsorship', icon: '💼' },
  { id: 'Permanent Residency (PR) / Express Entry', title: 'PR / Express Entry', desc: 'Points Assessment & PNP', icon: '🏠' },
  { id: 'Tourist / Visitor Visa', title: 'Visitor / Tourist', desc: 'Holiday & Family Visit', icon: '✈️' },
  { id: 'Spouse / Dependent Visa', title: 'Spouse Visa', desc: 'Open Work Permit for Spouse', icon: '💍' },
  { id: 'Business / Investor Visa', title: 'Business Visa', desc: 'Start-up & Entrepreneur', icon: '🏢' },
  { id: 'Other Visa Category', title: 'Other Category', desc: 'Super Visa / Custom Inquiries', icon: '🌍' }
];

const TARGET_COUNTRIES = [
  { name: 'Canada', flag: '🇨🇦', popular: true },
  { name: 'United Kingdom (UK)', flag: '🇬🇧', popular: true },
  { name: 'Australia', flag: '🇦🇺', popular: true },
  { name: 'United States (USA)', flag: '🇺🇸', popular: true },
  { name: 'Europe / Schengen', flag: '🇪🇺', popular: false },
  { name: 'New Zealand', flag: '🇳🇿', popular: false },
  { name: 'Germany', flag: '🇩🇪', popular: false },
  { name: 'Other Destination', flag: '🌐', popular: false }
];

const EDUCATION_LEVELS = [
  '12th / Senior Secondary',
  'Diploma / Polytechnic',
  "Bachelor's Degree (Graduation)",
  "Master's Degree (Post Graduation)",
  'Doctorate / Ph.D.',
  'Other'
];

const ENGLISH_TESTS = [
  'IELTS (Academic / General)',
  'PTE Academic',
  'TOEFL iBT',
  'Duolingo English Test (DET)',
  'Not Appeared Yet (Planning to take)',
  'Exempt / Not Required'
];

export default function ClientPortal({ isPublic = false }) {
  const { token } = useParams();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(!isPublic && Boolean(token));
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    visaType: 'Study Visa / Student Permit',
    targetCountry: 'Canada',
    dob: '',
    gender: 'Male',
    passportNumber: '',
    passportExpiry: '',
    highestEducation: "Bachelor's Degree (Graduation)",
    fieldOfStudy: '',
    passingYear: '',
    percentageOrCgpa: '',
    englishTest: 'IELTS (Academic / General)',
    overallScore: '',
    workExperienceYears: '0',
    currentJobTitle: '',
    hasVisaRefusal: 'No',
    refusalDetails: '',
    comments: ''
  });

  const [selectedFiles, setSelectedFiles] = useState([]);

  // Fetch client details if token provided
  useEffect(() => {
    if (token && !isPublic) {
      axios.get(`${BACKEND_URL}/api/portal/intake/${token}`)
        .then(res => {
          if (res.data.success && res.data.client) {
            const c = res.data.client;
            const vd = c.visaDetails || {};
            setFormData(prev => ({
              ...prev,
              fullName: c.fullName || '',
              email: c.email || '',
              phone: c.phone || '',
              address: c.address || '',
              city: c.city || '',
              state: c.state || '',
              postalCode: c.postalCode || '',
              country: c.country || 'India',
              visaType: vd.visaType || prev.visaType,
              targetCountry: vd.targetCountry || prev.targetCountry,
              dob: vd.dob || '',
              gender: vd.gender || 'Male',
              passportNumber: vd.passportNumber || '',
              passportExpiry: vd.passportExpiry || '',
              highestEducation: vd.highestEducation || prev.highestEducation,
              fieldOfStudy: vd.fieldOfStudy || '',
              passingYear: vd.passingYear || '',
              percentageOrCgpa: vd.percentageOrCgpa || '',
              englishTest: vd.englishTest || prev.englishTest,
              overallScore: vd.overallScore || '',
              workExperienceYears: vd.workExperienceYears || '0',
              currentJobTitle: vd.currentJobTitle || '',
              hasVisaRefusal: vd.hasVisaRefusal || 'No',
              refusalDetails: vd.refusalDetails || '',
              comments: vd.comments || ''
            }));
          }
        })
        .catch(err => {
          setErrorMessage(err.response?.data?.message || 'Invalid or expired portal link.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [token, isPublic]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...filesArray].slice(0, 10));
    }
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Step Validations
  const validateStep = (step) => {
    setErrorMessage('');
    if (step === 1) {
      if (!formData.targetCountry || !formData.visaType) {
        setErrorMessage('Please select your destination country and visa type.');
        return false;
      }
    }
    if (step === 2) {
      if (!formData.fullName.trim()) {
        setErrorMessage('Please enter your full name as per passport.');
        return false;
      }
      if (!formData.phone.trim()) {
        setErrorMessage('Please enter your WhatsApp / Phone number.');
        return false;
      }
      if (!formData.email.trim()) {
        setErrorMessage('Please enter your email address.');
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setErrorMessage('');
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(2)) {
      setCurrentStep(2);
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });
      selectedFiles.forEach(file => {
        data.append('files', file);
      });

      const endpoint = token && !isPublic
        ? `${BACKEND_URL}/api/portal/intake/${token}`
        : `${BACKEND_URL}/api/portal/public-apply`;

      const response = await axios.post(endpoint, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setSubmitted(true);
      } else {
        setErrorMessage(response.data.message || 'Submission failed. Please check your details.');
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to submit form. Please verify your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading View
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-t-2 border-b-2 border-indigo-600 animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500">Loading your application form...</p>
        </div>
      </div>
    );
  }

  // Submitted Success View
  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="max-w-lg w-full bg-white rounded-3xl border border-slate-200/90 shadow-xl p-8 sm:p-10 text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-6 ring-8 ring-emerald-50/50">
            <CheckCircleIcon className="w-12 h-12 stroke-[2]" />
          </div>

          <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Application Received
          </span>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-3">
            Thank you, {formData.fullName.split(' ')[0]}!
          </h2>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Your Visa Assessment & Application has been securely registered in our system.
          </p>

          <div className="mt-6 p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-left text-xs space-y-2.5">
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Destination Country</span>
              <span className="font-bold text-slate-900">{formData.targetCountry}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Visa Category</span>
              <span className="font-bold text-indigo-700">{formData.visaType}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">WhatsApp / Phone</span>
              <span className="font-bold text-slate-900">{formData.phone}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 font-medium">Documents Uploaded</span>
              <span className="font-bold text-emerald-600">{selectedFiles.length} File(s)</span>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500">
            <ShieldCheckIcon className="w-4 h-4 text-emerald-600" />
            <span>Assigned to certified counselor • Maninder Pal Singh</span>
          </div>
        </div>
      </div>
    );
  }

  const steps = [
    { num: 1, title: 'Visa & Destination' },
    { num: 2, title: 'Personal Details' },
    { num: 3, title: 'Academics & Score' },
    { num: 4, title: 'Documents & Submit' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100/70 via-slate-50 to-slate-100 font-sans pb-20">
      
      {/* Top Professional Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-base shadow-sm">
              M
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-none">Maninder Pal Singh</h1>
              <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                Visa & Immigration Services
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
              <LockClosedIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span>SSL Encrypted</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Form Center */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-6">
        
        {/* Unified Stepper Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          
          {/* Stepper Progress Bar */}
          <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200/80">
            <div className="flex items-center justify-between">
              {steps.map((st, idx) => (
                <div key={st.num} className="flex items-center flex-1 last:flex-none">
                  <button
                    type="button"
                    onClick={() => {
                      if (st.num < currentStep || validateStep(currentStep)) {
                        setCurrentStep(st.num);
                      }
                    }}
                    className={`flex items-center gap-2 text-xs font-bold transition-all ${
                      currentStep === st.num 
                        ? 'text-indigo-600' 
                        : currentStep > st.num 
                        ? 'text-emerald-600' 
                        : 'text-slate-400'
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                      currentStep === st.num
                        ? 'bg-indigo-600 text-white shadow-sm ring-4 ring-indigo-100'
                        : currentStep > st.num
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {currentStep > st.num ? <CheckIcon className="w-3.5 h-3.5 stroke-[3]" /> : st.num}
                    </span>
                    <span className="hidden sm:inline">{st.title}</span>
                  </button>

                  {idx < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-3 sm:mx-4 transition-colors ${
                      currentStep > st.num ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mx-6 sm:mx-8 mt-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center justify-between">
              <span>{errorMessage}</span>
              <button onClick={() => setErrorMessage('')} className="text-rose-500 hover:text-rose-700">
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-10">
            
            {/* STEP 1: DESTINATION & VISA */}
            {currentStep === 1 && (
              <div className="space-y-7 animate-fade-in">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                    Where would you like to apply?
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Select your preferred target country and visa category to get started.
                  </p>
                </div>

                {/* Country Chips Grid */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                    Target Destination Country <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {TARGET_COUNTRIES.map((c) => {
                      const isSelected = formData.targetCountry === c.name;
                      return (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => setFormData(p => ({ ...p, targetCountry: c.name }))}
                          className={`p-3.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/70 shadow-xs ring-2 ring-indigo-600/20'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white'
                          }`}
                        >
                          <span className="text-2xl">{c.flag}</span>
                          <span className={`text-xs font-bold leading-tight ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                            {c.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Visa Category Cards */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                    Visa Category / Service <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {VISA_TYPES.map((vt) => {
                      const isSelected = formData.visaType === vt.id;
                      return (
                        <button
                          key={vt.id}
                          type="button"
                          onClick={() => setFormData(p => ({ ...p, visaType: vt.id }))}
                          className={`p-4 rounded-xl border text-left flex items-start gap-3.5 transition-all ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/70 shadow-xs ring-2 ring-indigo-600/20'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white'
                          }`}
                        >
                          <span className="text-2xl">{vt.icon}</span>
                          <div>
                            <div className={`text-sm font-bold ${isSelected ? 'text-indigo-900' : 'text-slate-900'}`}>
                              {vt.title}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {vt.desc}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: PERSONAL & CONTACT DETAILS */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                    Personal & Contact Information
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Please provide accurate details as per your official passport records.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Full Name (as per Passport) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      placeholder="e.g. Gurpreet Singh"
                      className="w-full text-sm font-semibold rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      WhatsApp / Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      placeholder="+91 98765 43210"
                      className="w-full text-sm font-semibold rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="yourname@gmail.com"
                      className="w-full text-sm font-semibold rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleChange}
                      className="w-full text-sm font-medium rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full text-sm font-medium rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition-all cursor-pointer"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      City / Hometown
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="e.g. Ludhiana / Jalandhar / Delhi"
                      className="w-full text-sm font-medium rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      State / Province
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="e.g. Punjab, India"
                      className="w-full text-sm font-medium rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Passport Number (Optional)
                    </label>
                    <input
                      type="text"
                      name="passportNumber"
                      value={formData.passportNumber}
                      onChange={handleChange}
                      placeholder="e.g. Z1234567"
                      className="w-full text-sm uppercase font-mono font-bold rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Passport Expiry Date
                    </label>
                    <input
                      type="date"
                      name="passportExpiry"
                      value={formData.passportExpiry}
                      onChange={handleChange}
                      className="w-full text-sm font-medium rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: ACADEMIC BACKGROUND & LANGUAGE TEST */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                    Education & Language Proficiency
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Help us assess your eligibility by sharing your education and test scores.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Highest Level of Education
                    </label>
                    <select
                      name="highestEducation"
                      value={formData.highestEducation}
                      onChange={handleChange}
                      className="w-full text-sm font-medium rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition-all cursor-pointer"
                    >
                      {EDUCATION_LEVELS.map(lvl => (
                        <option key={lvl} value={lvl}>{lvl}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Stream / Major / Subject
                    </label>
                    <input
                      type="text"
                      name="fieldOfStudy"
                      value={formData.fieldOfStudy}
                      onChange={handleChange}
                      placeholder="e.g. Commerce / Computer Science / Arts"
                      className="w-full text-sm font-medium rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Passing Year & Percentage (%)
                    </label>
                    <input
                      type="text"
                      name="percentageOrCgpa"
                      value={formData.percentageOrCgpa}
                      onChange={handleChange}
                      placeholder="e.g. 2023 - 75%"
                      className="w-full text-sm font-medium rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      English Language Test
                    </label>
                    <select
                      name="englishTest"
                      value={formData.englishTest}
                      onChange={handleChange}
                      className="w-full text-sm font-medium rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition-all cursor-pointer"
                    >
                      {ENGLISH_TESTS.map(test => (
                        <option key={test} value={test}>{test}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Overall Score / Bands
                    </label>
                    <input
                      type="text"
                      name="overallScore"
                      value={formData.overallScore}
                      onChange={handleChange}
                      placeholder="e.g. 6.5 Overall (L:7, R:6, W:6.5, S:6)"
                      className="w-full text-sm font-semibold rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Work Experience (Years)
                    </label>
                    <input
                      type="text"
                      name="workExperienceYears"
                      value={formData.workExperienceYears}
                      onChange={handleChange}
                      placeholder="e.g. 2 Years"
                      className="w-full text-sm font-medium rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Any Previous Visa Refusal?
                    </label>
                    <select
                      name="hasVisaRefusal"
                      value={formData.hasVisaRefusal}
                      onChange={handleChange}
                      className="w-full text-sm font-medium rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition-all cursor-pointer"
                    >
                      <option value="No">No, Never Refused (Fresh Applicant)</option>
                      <option value="Yes">Yes, I had a previous refusal</option>
                    </select>
                  </div>

                  {formData.hasVisaRefusal === 'Yes' && (
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Refusal Country & Reason
                      </label>
                      <input
                        type="text"
                        name="refusalDetails"
                        value={formData.refusalDetails}
                        onChange={handleChange}
                        placeholder="e.g. Canada Student Visa refused in 2022"
                        className="w-full text-sm font-medium rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 4: DOCUMENTS & CONFIRMATION */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                    Upload Documents & Final Notes
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Upload your passport copy, resume, and certificates (PDF or Images up to 15MB each).
                  </p>
                </div>

                {/* Dropzone */}
                <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-8 text-center bg-slate-50/70 hover:bg-indigo-50/20 transition-all">
                  <input
                    type="file"
                    multiple
                    id="portal-files"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    className="hidden"
                  />
                  <label htmlFor="portal-files" className="cursor-pointer flex flex-col items-center">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                      <DocumentArrowUpIcon className="w-7 h-7 stroke-[2]" />
                    </div>
                    <span className="text-sm font-bold text-slate-900">
                      Click to choose documents from your device
                    </span>
                    <span className="text-xs text-slate-500 mt-1">
                      Passport, Academic Certificates, IELTS/PTE Result, Resume
                    </span>
                  </label>
                </div>

                {/* Attached Files List */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700">Attached Files ({selectedFiles.length}):</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {selectedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <span className="font-bold text-slate-800 truncate">{file.name}</span>
                            <span className="text-[10px] text-slate-400 shrink-0">({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Client Comments */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Any specific question or preferred intake/university:
                  </label>
                  <textarea
                    name="comments"
                    rows={3}
                    value={formData.comments}
                    onChange={handleChange}
                    placeholder="Tell us about your target course, budget, or preferred intake (e.g. September 2026 intake)..."
                    className="w-full text-sm font-medium rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                  />
                </div>

                {/* Summary Card */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-500">Applicant:</span>
                    <span className="font-bold text-slate-900">{formData.fullName} ({formData.phone})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-500">Application:</span>
                    <span className="font-bold text-indigo-700">{formData.targetCountry} — {formData.visaType}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step Navigation Actions */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between gap-3">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 transition-all"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  <span>Previous</span>
                </button>
              ) : (
                <div></div>
              )}

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-7 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md shadow-indigo-200 transition-all hover:shadow-lg"
                >
                  <span>Continue</span>
                  <ArrowRightIcon className="w-4 h-4 stroke-[2.5]" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md shadow-emerald-200 transition-all hover:shadow-lg disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                      <span>Submitting Application...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-4 h-4 stroke-[2.5]" />
                      <span>Submit Application Now</span>
                    </>
                  )}
                </button>
              )}
            </div>

          </form>
        </div>

        {/* Footer Guarantee */}
        <div className="mt-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <ShieldCheckIcon className="w-4 h-4 text-emerald-600" />
          <span>Strictly confidential • Verified & protected by Maninder Pal Singh</span>
        </div>

      </main>
    </div>
  );
}

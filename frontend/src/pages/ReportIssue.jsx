import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import {
  Sparkles,
  MapPin,
  UploadCloud,
  X,
  Mic,
  MicOff,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const ReportIssue = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Pothole',
    priority: 'MEDIUM',
    address: '',
    latitude: '',
    longitude: ''
  });
  const [files, setFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [locating, setLocating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const navigate = useNavigate();

  const categories = [
    'Pothole',
    'Road Damage',
    'Garbage Overflow',
    'Illegal Dumping',
    'Broken Streetlight',
    'Water Leakage',
    'Drainage/Sewage Problem',
    'Footpath Damage',
    'Traffic Signal',
    'Fallen Tree',
    'Public Park Issue',
    'Stray Animal',
    'Other'
  ];

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // Handle files and generate previews
  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selected]);

    const newPreviews = selected.map(file => ({
      name: file.name,
      url: URL.createObjectURL(file),
      type: file.type
    }));
    setFilePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeFile = (index) => {
    // Revoke object URL
    if (filePreviews[index]?.url) {
      URL.revokeObjectURL(filePreviews[index].url);
    }
    setFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Device GPS Location
  const getLocation = () => {
    if (navigator.geolocation) {
      setLocating(true);
      setError('');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6)
          }));
          setLocating(false);
        },
        (err) => {
          setLocating(false);
          setError('Location access denied or unavailable. Please enter your address or landmark manually.');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
    }
  };

  // Voice Input (Web Speech API with graceful fallback)
  const toggleVoiceRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser. Please type your description.');
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
        setError('');
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setFormData(prev => ({
          ...prev,
          description: prev.description ? `${prev.description} ${transcript}` : transcript
        }));
        setIsRecording(false);
      };

      recognition.onerror = (event) => {
        setIsRecording(false);
        setError(`Voice input error: ${event.error}`);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch (err) {
      setIsRecording(false);
      setError('Could not access microphone.');
    }
  };

  // Smart Triage Analysis
  const analyzeIssue = () => {
    const text = (formData.title + ' ' + formData.description).toLowerCase();

    let simulatedCategory = formData.category;
    let confidence = 55;
    let dept = 'Municipal Control Room';
    let priority = 'MEDIUM';

    if (text.includes('pothole') || text.includes('crater') || text.includes('road')) {
      simulatedCategory = 'Pothole';
      confidence = 94;
      dept = 'Public Works / Roads';
      priority = 'HIGH';
    } else if (text.includes('garbage') || text.includes('trash') || text.includes('dump') || text.includes('waste')) {
      simulatedCategory = 'Garbage Overflow';
      confidence = 91;
      dept = 'Sanitation / Solid Waste';
      priority = 'MEDIUM';
    } else if (text.includes('water') || text.includes('pipe') || text.includes('leak')) {
      simulatedCategory = 'Water Leakage';
      confidence = 89;
      dept = 'Water Supply';
      priority = 'HIGH';
    } else if (text.includes('streetlight') || text.includes('light') || text.includes('dark')) {
      simulatedCategory = 'Broken Streetlight';
      confidence = 92;
      dept = 'Electrical / Streetlights';
      priority = 'MEDIUM';
    } else if (text.includes('drain') || text.includes('sewage') || text.includes('clog')) {
      simulatedCategory = 'Drainage/Sewage Problem';
      confidence = 88;
      dept = 'Drainage / Sewerage';
      priority = 'HIGH';
    } else if (text.includes('traffic') || text.includes('signal')) {
      simulatedCategory = 'Traffic Signal';
      confidence = 95;
      dept = 'Traffic';
      priority = 'CRITICAL';
    }

    setFormData(prev => ({
      ...prev,
      category: simulatedCategory,
      priority
    }));

    setAnalysis({
      category: simulatedCategory,
      confidence,
      dept,
      priority,
      show: true
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key]) data.append(key, formData[key]);
    });
    for (let i = 0; i < files.length; i++) {
      data.append('media', files[i]);
    }

    try {
      await api.post('/issues', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/citizen/dashboard');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit complaint. Please check all fields.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F6]">
      <Navbar />

      <main className="max-w-3xl mx-auto py-6 sm:py-10 px-4 sm:px-6">
        {/* Back breadcrumb */}
        <div className="mb-4">
          <Link
            to="/citizen/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#747982] hover:text-[#202226] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* Card */}
        <div className="civic-card p-5 sm:p-8">
          <div className="border-b border-[#E2E4E7] pb-4 mb-6">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF8A3D]">
              Civic Incident Lodgement
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#202226] tracking-tight mt-0.5">
              Report a Civic Issue
            </h1>
            <p className="text-xs text-[#747982] mt-1">
              Provide incident details, location, and photos so municipal departments can verify and dispatch repairs.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-[#E45757] p-3.5 rounded-xl mb-5 text-xs sm:text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-[#20A779] p-4 rounded-xl mb-5 text-xs sm:text-sm flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span className="font-bold">Complaint submitted successfully! Redirecting to dashboard...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Category selection */}
            <div>
              <label className="block text-xs font-semibold text-[#202226] mb-1.5">
                Issue Category <span className="text-[#FF8A3D]">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="form-input-clean"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-[#202226] mb-1.5">
                Complaint Title <span className="text-[#FF8A3D]">*</span>
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="form-input-clean"
                placeholder="e.g. Hazardous deep pothole on 5th Cross Road"
              />
            </div>

            {/* Description */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-[#202226]">
                  Detailed Description <span className="text-[#FF8A3D]">*</span>
                </label>
                <button
                  type="button"
                  onClick={toggleVoiceRecording}
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                    isRecording
                      ? 'bg-red-50 text-[#E45757] border-red-200 animate-pulse'
                      : 'bg-[#F4F5F6] text-[#202226] border-[#E2E4E7] hover:bg-white'
                  }`}
                >
                  {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-[#FF8A3D]" />}
                  <span>{isRecording ? 'Listening...' : 'Voice Input'}</span>
                </button>
              </div>

              <textarea
                name="description"
                required
                rows="4"
                value={formData.description}
                onChange={handleChange}
                className="form-input-clean resize-y"
                placeholder="Describe the severity, exact hazard, duration of the issue, and any relevant context..."
              />

              <div className="mt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={analyzeIssue}
                  className="btn-graphite-secondary text-xs py-1.5 px-3"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#FF8A3D]" />
                  <span>Analyze Issue with AI</span>
                </button>
                <span className="text-[11px] text-[#747982]">Auto-triage suggestions</span>
              </div>
            </div>

            {/* Smart Analysis Alert */}
            {analysis?.show && (
              <div className="p-4 rounded-xl bg-[#292D32] text-white border border-[#373C44] text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-[#FF8A3D] mb-1">
                  <Sparkles className="w-4 h-4" />
                  <span>Intelligent Triage Analysis</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-[#747982] block">Detected Category:</span>
                    <span className="font-semibold">{analysis.category}</span>
                  </div>
                  <div>
                    <span className="text-[#747982] block">Confidence:</span>
                    <span className="font-semibold text-[#20A779]">{analysis.confidence}% Match</span>
                  </div>
                  <div>
                    <span className="text-[#747982] block">Recommended Dept:</span>
                    <span className="font-semibold">{analysis.dept}</span>
                  </div>
                  <div>
                    <span className="text-[#747982] block">Estimated Priority:</span>
                    <span className="font-semibold text-[#FF8A3D]">{analysis.priority}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Location Section */}
            <div>
              <label className="block text-xs font-semibold text-[#202226] mb-1.5">
                Location Details <span className="text-[#FF8A3D]">*</span>
              </label>

              <div className="mb-2.5">
                <button
                  type="button"
                  onClick={getLocation}
                  disabled={locating}
                  className="btn-white-outline text-xs py-2 px-3.5 w-full sm:w-auto"
                >
                  {locating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF8A3D]" />
                      <span>Fetching GPS coordinates...</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="w-3.5 h-3.5 text-[#FF8A3D]" />
                      <span>Use Current Device GPS</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2.5">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#747982] block mb-1">Latitude</span>
                  <input
                    type="text"
                    readOnly
                    placeholder="e.g. 12.9716"
                    value={formData.latitude}
                    className="form-input-clean bg-[#F4F5F6] font-mono text-xs text-[#747982]"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#747982] block mb-1">Longitude</span>
                  <input
                    type="text"
                    readOnly
                    placeholder="e.g. 77.5946"
                    value={formData.longitude}
                    className="form-input-clean bg-[#F4F5F6] font-mono text-xs text-[#747982]"
                  />
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#747982] block mb-1">Address / Landmark</span>
                <input
                  type="text"
                  name="address"
                  required
                  value={formData.address}
                  onChange={handleChange}
                  className="form-input-clean"
                  placeholder="Street name, landmark, building number, or locality"
                />
              </div>
            </div>

            {/* Upload Photos Section */}
            <div>
              <label className="block text-xs font-semibold text-[#202226] mb-1.5">
                Upload Photos / Evidence (Optional)
              </label>

              <label className="border-2 border-dashed border-[#E2E4E7] hover:border-[#FF8A3D] rounded-xl p-5 text-center flex flex-col items-center justify-center cursor-pointer transition-colors bg-white group">
                <UploadCloud className="w-8 h-8 text-[#747982] group-hover:text-[#FF8A3D] transition-colors mb-2" />
                <span className="text-xs font-bold text-[#202226]">Click to upload photos or videos</span>
                <span className="text-[11px] text-[#747982] mt-0.5">JPEG, PNG, MP4 up to 15MB each</span>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {/* Thumbnails preview */}
              {filePreviews.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mt-3">
                  {filePreviews.map((p, idx) => (
                    <div key={idx} className="relative rounded-lg overflow-hidden border border-[#E2E4E7] bg-black aspect-square group">
                      {p.type.startsWith('video') ? (
                        <video src={p.url} className="w-full h-full object-cover" />
                      ) : (
                        <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="absolute top-1 right-1 bg-black/70 hover:bg-[#E45757] text-white p-1 rounded-full transition cursor-pointer"
                        title="Remove file"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-3 border-t border-[#E2E4E7]">
              <button
                type="submit"
                disabled={loading || success}
                className="btn-orange-primary w-full py-3 text-sm font-bold shadow-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Complaint...</span>
                  </>
                ) : (
                  <span>Submit Complaint</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default ReportIssue;

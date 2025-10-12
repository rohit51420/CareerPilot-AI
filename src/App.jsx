import React, { useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    signInAnonymously
} from 'firebase/auth';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc,
    collection,
    writeBatch,
    getDocs,
    query,
    where
} from 'firebase/firestore';

// --- Firebase Configuration ---
// Yahaan apna Firebase project configuration daalein.
const firebaseConfig = {
  apiKey: "AIzaSyDbUZPRoYKIo2yEB4x0pRbQm-Mrq_i9Rp4",
  authDomain: "career-council-caf43.firebaseapp.com",
  projectId: "career-council-caf43",
  storageBucket: "career-council-caf43.firebasestorage.app",
  messagingSenderId: "1021230419673",
  appId: "1:1021230419673:web:1c1674f97a46ada8def8c8"
};

// --- (IMPORTANT) Yahaan apni Gemini API Key paste kar ---
const GEMINI_API_KEY = "AIzaSyDFuGjDYvXlM8-FWPeu5sZsHLSFOBD2L30";

// --- Firebase ko Shuru Karein ---
const isConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== "PASTE_YOUR_FIREBASE_API_KEY_HERE";
let app, auth, db;
if (isConfigured) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
}

// --- App Context (State Management ke liye) ---
const AppContext = createContext(null);

// --- Helper Components & Icons ---

const IconHome = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
const IconCollege = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7L12 2z"></path><path d="M12 22V12"></path><path d="m22 10-10 5L2 10"></path></svg>;
const IconResources = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>;
const IconSettings = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l-.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l-.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0 2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>;
const IconLogout = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>;
const Spinner = () => <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>;
const Modal = ({ show, onClose, title, children }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h3>
                    {/* FIX: Replaced the simple text 'x' with a more visible, styled SVG icon button */}
                    <button 
                        onClick={onClose} 
                        className="p-1 rounded-full text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-blue-500"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <div>{children}</div>
            </div>
        </div>
    );
};


// --- Database Seeding Data and Logic ---
const indianStatesAndUTs = [
  "All", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu & Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

// --- Recommendation Engine ---
const quizQuestions = [
    // Section 1: Core Interests
    { id: 'interest', text: 'Which activity excites you the most?', options: ['Building or deconstructing things', 'Expressing ideas through art/writing', 'Organizing teams and projects', 'Researching and discovering new things'] },
    { id: 'subject', text: 'Which school subject feels less like work and more like fun?', options: ['Physics & Maths', 'Literature & History', 'Economics & Business', 'Biology & Chemistry'] },
    // Section 2: Work Style & Environment
    { id: 'work_style', text: 'What kind of work environment do you see yourself thriving in?', options: ['A structured, predictable role with clear tasks', 'A dynamic, flexible space with new challenges daily', 'A competitive, goal-oriented setting', 'A quiet, independent and research-focused lab'] },
    { id: 'collaboration', text: 'How do you prefer to work on projects?', options: ['Mostly by myself, focusing deeply', 'In a small, collaborative team bouncing ideas', 'Leading a large group towards a common goal', 'A healthy mix of solo and team work'] },
    // Section 3: Problem-Solving Approach
    { id: 'problem_solving', text: 'When faced with a complex problem, what is your first instinct?', options: ['Break it down and analyze data for a logical solution', 'Brainstorm creative and unconventional ideas', 'Organize a step-by-step plan and delegate tasks', 'Consult with others and build a consensus'] },
    { id: 'thinking_style', text: 'Are you more of a...', options: ['Big-picture thinker (strategic)', 'Detail-oriented person (tactical)'] },
    // Section 4: Personality & Values
    { id: 'career_goal', text: 'What is your single most important long-term career goal?', options: ['Financial security and a stable life', 'Creative freedom and self-expression', 'Making a significant impact on society', 'Driving innovation with cutting-edge technology'] },
    { id: 'risk_appetite', text: 'How do you feel about taking risks in your career?', options: ['I prefer a safe, secure path', 'I am willing to take calculated risks for high rewards'] },
    // Section 5: Skills & Aptitude
    { id: 'skill_type', text: 'Would you rather be an expert in...', options: ['A technical skill (like coding or machine operation)', 'A people-oriented skill (like communication or management)'] },
    { id: 'learning_style', text: 'How do you learn best?', options: ['Through hands-on practice and building things', 'Through reading, theory and discussion'] },
    // Section 6: Future Outlook
    { id: 'work_life_balance', text: 'What does your ideal work-life balance look like?', options: ['A standard 9-to-5 job with free weekends', 'Flexible hours, even if it means working late sometimes'] },
    { id: 'job_location', text: 'Where do you imagine yourself working in the future?', options: ['In a large, corporate office in a metro city', 'Remotely, or in a smaller town with a relaxed pace'] },
];

const getStaticRecommendation = (answers) => {
    if (!answers || Object.keys(answers).length < quizQuestions.length) {
        return { stream: "Awaiting Your Answers...", careers: [], reason: "Complete the quiz to unlock your personalized career path!" };
    }

    const scores = { 'Engineering & Tech': 0, 'Medical': 0, 'Arts & Humanities': 0, 'Business': 0 };

    // Scoring logic based on new questions
    if (answers.interest?.includes('Building')) scores['Engineering & Tech'] += 2;
    if (answers.interest?.includes('Expressing')) scores['Arts & Humanities'] += 2;
    if (answers.interest?.includes('Organizing')) scores['Business'] += 2;
    if (answers.interest?.includes('Researching')) scores['Medical'] += 2;

    if (answers.subject?.includes('Physics')) scores['Engineering & Tech'] += 2;
    if (answers.subject?.includes('Literature')) scores['Arts & Humanities'] += 2;
    if (answers.subject?.includes('Economics')) scores['Business'] += 2;
    if (answers.subject?.includes('Biology')) scores['Medical'] += 2;

    if (answers.work_style?.includes('structured')) { scores['Engineering & Tech']++; scores['Business']++; }
    if (answers.work_style?.includes('dynamic')) scores['Arts & Humanities'] += 2;
    if (answers.work_style?.includes('competitive')) scores['Business']++;
    if (answers.work_style?.includes('independent')) scores['Medical']++;

    if (answers.collaboration?.includes('Leading')) scores['Business'] += 2;
    if (answers.collaboration?.includes('small, collaborative')) scores['Arts & Humanities']++;

    if (answers.problem_solving?.includes('logical')) scores['Engineering & Tech'] += 2;
    if (answers.problem_solving?.includes('creative')) scores['Arts & Humanities'] += 2;
    if (answers.problem_solving?.includes('plan')) scores['Business'] += 2;

    if (answers.career_goal?.includes('Financial')) scores['Business'] += 2;
    if (answers.career_goal?.includes('Creative')) scores['Arts & Humanities'] += 2;
    if (answers.career_goal?.includes('impact')) scores['Medical'] += 2;
    if (answers.career_goal?.includes('innovation')) scores['Engineering & Tech'] += 2;
    
    if (answers.skill_type?.includes('technical')) scores['Engineering & Tech']++;
    if (answers.skill_type?.includes('people')) { scores['Business']++; scores['Arts & Humanities']++; }

    const highestScore = Math.max(...Object.values(scores));
    const bestStream = Object.keys(scores).find(stream => scores[stream] === highestScore) || "Interdisciplinary";

    let result = { stream: bestStream, careers: [], reason: "" };

    switch (bestStream) {
        case 'Engineering & Tech':
            result.careers = ["Software Engineer", "AI/ML Engineer", "Data Scientist", "Robotics Engineer", "Cybersecurity Analyst"];
            result.reason = "Your logical, problem-solving mindset and interest in technology make you a great fit for engineering.";
            break;
        case 'Medical':
            result.careers = ["Doctor (MBBS)", "Biotechnologist", "Pharmacist", "Medical Researcher", "Psychologist"];
            result.reason = "Your inclination to help others and research points towards a fulfilling career in medical sciences.";
            break;
        case 'Arts & Humanities':
            result.careers = ["Journalist", "Graphic Designer", "Filmmaker", "Lawyer (after LL.B.)", "UX/UI Designer"];
            result.reason = "Your creative flair and communication skills are perfect for the diverse fields in arts and humanities.";
            break;
        case 'Business':
            result.careers = ["Investment Banker", "Marketing Manager", "Entrepreneur", "Management Consultant", "Financial Analyst"];
            result.reason = "Your leadership qualities, strategic thinking, and financial acumen are ideal for the dynamic world of commerce.";
            break;
        default:
            result.careers = ["Data Analyst", "Product Manager", "Technical Writer"];
            result.reason = "Your interests are diverse. Consider interdisciplinary fields that combine technology, creativity, and business.";
    }

    return result;
};


// --- React Components ---

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuthAction = async (e) => {
        e.preventDefault();
        if (!isConfigured) {
             setError("Firebase is not configured. Please add your credentials.");
             return;
        }
        setError('');
        setLoading(true);
        try {
            if (isRegistering) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    const handleAnonymousSignIn = async () => {
         if (!isConfigured) {
             setError("Firebase is not configured. Please add your credentials.");
             return;
        }
        setError('');
        setLoading(true);
        try {
            await signInAnonymously(auth);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }


    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Digital Guidance</h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-300">Your personalized career advisor.</p>
                </div>

                {!isConfigured && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">
                        <p className="font-bold">Configuration Missing</p>
                        <p>Firebase is not configured. Please update the `firebaseConfig` object in the code to use the application.</p>
                    </div>
                )}
                
                <form className="mt-8 space-y-6" onSubmit={handleAuthAction}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                    <div>
                        <button
                            type="submit"
                            disabled={loading || !isConfigured}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 dark:disabled:bg-blue-800"
                        >
                            {loading ? <Spinner /> : (isRegistering ? 'Register' : 'Sign In')}
                        </button>
                    </div>
                </form>

                <div className="text-center">
                    <button
                        onClick={() => setIsRegistering(!isRegistering)}
                        className="font-medium text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                        {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Register"}
                    </button>
                </div>
                 <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                    <span className="flex-shrink mx-4 text-gray-400">Or</span>
                    <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="text-center">
                     <button
                        onClick={handleAnonymousSignIn}
                        disabled={loading || !isConfigured}
                        className="font-medium text-sm text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
                    >
                        Continue as Guest
                    </button>
                </div>
            </div>
        </div>
    );
}

function HomePage() {
    const { userProfile, saveUserProfile } = useContext(AppContext);
    const [quizAnswers, setQuizAnswers] = useState(userProfile.quizAnswers || {});
    
    const [aiRecommendation, setAiRecommendation] = useState(null);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiError, setAiError] = useState('');

    const [showCareerModal, setShowCareerModal] = useState(false);
    const [selectedCareer, setSelectedCareer] = useState('');
    const [careerDetails, setCareerDetails] = useState('');
    const [isCareerLoading, setIsCareerLoading] = useState(false);


    useEffect(() => {
        setQuizAnswers(userProfile.quizAnswers || {});
    }, [userProfile.quizAnswers]);
    
    const handleAnswerChange = (questionId, answer) => {
        const newAnswers = { ...quizAnswers, [questionId]: answer };
        setQuizAnswers(newAnswers);
        setAiRecommendation(null);
        saveUserProfile({ quizAnswers: newAnswers });
    };

    const staticRecommendation = useMemo(() => getStaticRecommendation(quizAnswers), [quizAnswers]);
    const isQuizComplete = Object.keys(quizAnswers).length === quizQuestions.length;

    const getAiRecommendation = async () => {
        if (!isQuizComplete) {
            setAiError("Please complete the entire quiz to get an AI recommendation.");
            return;
        }
        if (!GEMINI_API_KEY || GEMINI_API_KEY === "PASTE_YOUR_GEMINI_API_KEY_HERE") {
            setAiError("AI features are disabled. API Key is not configured.");
            return;
        }
        setIsAiLoading(true);
        setAiError('');
        setAiRecommendation(null);

        const initialStream = staticRecommendation.stream;

        const prompt = `Act as an expert career counselor for a student in India. The student's profile strongly suggests they are a good fit for the "${initialStream}" stream.
        
        Based on their detailed quiz answers below, provide a more detailed and personalized analysis WITHIN THIS STREAM.
        
        Quiz Answers:
        - Main Interest: ${quizAnswers.interest}
        - Favorite Subject: ${quizAnswers.subject}
        - Preferred Work Style: ${quizAnswers.work_style}
        - Collaboration Preference: ${quizAnswers.collaboration}
        - Problem-Solving Approach: ${quizAnswers.problem_solving}
        - Primary Career Goal: ${quizAnswers.career_goal}

        Suggest 3-5 modern and specific career paths within the "${initialStream}" stream and give an encouraging reason that connects their specific answers to these paths.
        
        Important: Respond ONLY with a valid JSON object. The "stream" key in the JSON MUST be "${initialStream}".
        Structure: { "stream": "${initialStream}", "careers": ["string", "string", ...], "reason": "string" }`;

        try {
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`API call failed: ${response.status}. Body: ${errorBody}`);
            }

            const result = await response.json();
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (text) {
                const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
                const parsed = JSON.parse(cleanedText);
                setAiRecommendation(parsed);
            } else {
                throw new Error("No content received from API.");
            }

        } catch (error) {
            console.error("Error fetching AI recommendation:", error);
            setAiError("Sorry, we couldn't get an AI recommendation. Please try again.");
        } finally {
            setIsAiLoading(false);
        }
    };
    
    const fetchCareerDetails = async (careerName) => {
        setSelectedCareer(careerName);
        setShowCareerModal(true);
        setIsCareerLoading(true);
        setCareerDetails('');

        if (!GEMINI_API_KEY || GEMINI_API_KEY === "PASTE_YOUR_GEMINI_API_KEY_HERE") {
            setCareerDetails("Sorry, this feature is currently disabled.");
            setIsCareerLoading(false);
            return;
        }

        const prompt = `Provide a concise and encouraging overview for a student in India about a career as a "${careerName}". 
        Include these sections using markdown:
        - **What you'll do:** (2-3 key responsibilities)
        - **Skills you'll need:** (3-4 essential skills)
        - **Job Outlook:** (A brief, positive note on the future prospects in India)
        
        Keep the language simple and inspiring.`;

        try {
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });

             if (!response.ok) throw new Error("API call failed.");

            const result = await response.json();
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
            setCareerDetails(text || "Could not retrieve details for this career.");

        } catch (error) {
            console.error("Error fetching career details:", error);
            setCareerDetails("Sorry, there was an error fetching details.");
        } finally {
            setIsCareerLoading(false);
        }
    };

    const recommendation = aiRecommendation || staticRecommendation;

    return (
        <div className="p-4 md:p-8 space-y-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Aptitude & Interest Assessment</h2>
                <div className="space-y-6">
                    {quizQuestions.map(q => (
                        <div key={q.id}>
                            <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">{q.text}</p>
                            <div className="flex flex-wrap gap-2">
                                {q.options.map(option => (
                                    <button
                                        key={option}
                                        onClick={() => handleAnswerChange(q.id, option)}
                                        className={`px-4 py-2 text-sm rounded-full transition-colors duration-200 ${quizAnswers[q.id] === option ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-blue-200 dark:hover:bg-gray-600'}`}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Personalized Recommendations</h2>
                    <button
                        onClick={getAiRecommendation}
                        disabled={!isQuizComplete || isAiLoading}
                        className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg shadow-md hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isAiLoading ? <Spinner/> : '✨ Deepen with AI'}
                    </button>
                </div>

                {aiError && <p className="text-sm text-red-500 text-center mb-4">{aiError}</p>}

                <div className="bg-blue-50 dark:bg-gray-700 p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-blue-800 dark:text-blue-300">{recommendation.stream}</h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-2 mb-4 whitespace-pre-wrap">{recommendation.reason}</p>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Potential Career Paths:</h4>
                    <div className="flex flex-wrap gap-3">
                        {recommendation.careers.map(career => (
                             <div key={career} className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900 rounded-full pr-1">
                                <span className="text-blue-800 dark:text-blue-200 text-xs font-medium pl-2.5 py-1">{career}</span>
                                {!career.toLowerCase().includes('complete the quiz') && (
                                     <button onClick={() => fetchCareerDetails(career)} className="text-xs bg-blue-500 text-white rounded-full px-2 py-0.5 hover:bg-blue-600 transition">Explore</button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <Modal show={showCareerModal} onClose={() => setShowCareerModal(false)} title={`About: ${selectedCareer}`}>
                {isCareerLoading ? (
                    <div className="flex justify-center items-center h-40"><Spinner /></div>
                ) : (
                    <div className="text-gray-700 dark:text-gray-300 space-y-4 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: careerDetails.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />') }}></div>
                )}
            </Modal>
        </div>
    );
}

const collegeCache = {};

function CollegesDirectory() {
    const { userProfile } = useContext(AppContext);
    const [colleges, setColleges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [streamFilter, setStreamFilter] = useState('All');
    
    const [showCollegeModal, setShowCollegeModal] = useState(false);
    const [selectedCollege, setSelectedCollege] = useState(null);
    const [collegeDetails, setCollegeDetails] = useState(null);
    const [isCollegeDetailsLoading, setIsCollegeDetailsLoading] = useState(false);

    const fetchCollegesByState = useCallback(async (state) => {
        if (collegeCache[state]) {
            setColleges(collegeCache[state]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError('');
        setColleges([]);

        if (!GEMINI_API_KEY || GEMINI_API_KEY === "PASTE_YOUR_GEMINI_API_KEY_HERE") {
            setError("AI features are disabled. API Key is not configured.");
            setLoading(false);
            return;
        }

        try {
            const prompt = `List the top 15-20 government/publicly-funded engineering, medical, arts, and business colleges in the state of "${state}", India. 
            Important: Respond ONLY with a valid JSON array. Each object in the array should have this exact structure:
            {"id": "A unique short code for the college", "name": "Full College Name", "location": "${state}", "programs": ["Key Program 1", "Key Program 2"], "stream": ["Engineering & Tech", "Medical", etc.]}`;
            
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });

            if (!response.ok) throw new Error("API call failed.");
            const result = await response.json();
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
                const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
                const parsed = JSON.parse(cleanedText);
                collegeCache[state] = parsed; // Cache the result
                setColleges(parsed);
            } else { throw new Error("No content from API."); }
        } catch (err) {
            console.error("Error fetching colleges by state:", err);
            setError(`Could not fetch colleges for ${state}. Please try another state.`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (userProfile.location && userProfile.location !== 'All') {
            fetchCollegesByState(userProfile.location);
        } else {
            setColleges([]);
            setLoading(false);
        }
    }, [userProfile.location, fetchCollegesByState]);
    
    const fetchCollegeDetails = async (college) => {
        setSelectedCollege(college);
        setShowCollegeModal(true);
        setIsCollegeDetailsLoading(true);
        setCollegeDetails(null);

        if (!GEMINI_API_KEY || GEMINI_API_KEY === "PASTE_YOUR_GEMINI_API_KEY_HERE") {
             setCollegeDetails({error: "AI features are disabled. API Key is not configured."});
             setIsCollegeDetailsLoading(false);
            return;
        }

        try {
            const prompt = `Provide a detailed overview for "${college.name}, ${college.location}". I need comprehensive and practical information for a prospective student in India.
            
            Important: Respond ONLY with a valid JSON object with the following structure:
            {
              "about": "A brief, engaging paragraph about the college's history and reputation.",
              "programs": [
                {"name": "B.Tech Computer Science", "fees": "Approx. ₹2.15 Lakhs per year", "duration": "4 years"},
                {"name": "B.Tech Electrical Engineering", "fees": "Approx. ₹2.15 Lakhs per year", "duration": "4 years"}
              ],
              "cutoffs": [
                {"exam": "JEE Advanced", "category": "General", "rank": "100 - 500"},
                {"exam": "JEE Advanced", "category": "OBC", "rank": "501 - 1500"},
                {"exam": "JEE Advanced", "category": "SC/ST", "rank": "1501 - 3000"}
              ],
              "admissionProcess": "A step-by-step guide on how to get in, including required exams and counselling process.",
              "facilities": ["Library", "Hostels", "Sports Complex", "Labs", "Incubation Cell"]
            }
            Generate realistic but sample data if exact numbers are not available. The structure must be followed.`;

            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });

            if (!response.ok) throw new Error("API call failed.");
            const result = await response.json();
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
                const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
                const parsed = JSON.parse(cleanedText);
                setCollegeDetails(parsed);
            } else { throw new Error("No content from API."); }

        } catch (error) {
            console.error("Error fetching college details:", error);
            setCollegeDetails({error: "Sorry, we couldn't fetch the details for this college right now."});
        } finally {
            setIsCollegeDetailsLoading(false);
        }
    };
    
    const filteredColleges = useMemo(() => {
        return colleges
            .filter(college => streamFilter === 'All' || (college.stream && college.stream.includes(streamFilter)))
            .filter(college => college.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [colleges, searchTerm, streamFilter]);

    return (
        <div className="p-4 md:p-8 space-y-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Government Colleges Directory</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <input
                        type="text"
                        placeholder="Search within results..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                     <select
                        value={streamFilter}
                        onChange={(e) => setStreamFilter(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="All">Filter by Stream (All)</option>
                        <option value="Engineering & Tech">Engineering & Tech</option>
                        <option value="Medical">Medical</option>
                        <option value="Arts & Humanities">Arts & Humanities</option>
                        <option value="Business">Business</option>
                    </select>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                    Showing colleges for <span className="font-semibold text-blue-600 dark:text-blue-400">{userProfile.location}</span>. Change location in Settings.
                </p>
                {loading ? <div className="flex flex-col items-center justify-center h-40"><Spinner /><p className="mt-2 text-sm text-gray-500">Our AI is finding the best colleges in {userProfile.location}...</p></div>
                : error ? <p className="text-red-500 text-center">{error}</p>
                : filteredColleges.length === 0 ? <p className="text-gray-500 text-center">No colleges found. Try changing filters or select a state in Settings.</p>
                : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredColleges.map(college => (
                            <div key={college.id || college.name} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 flex flex-col justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">{college.name}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{college.location}</p>
                                    <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mt-3">Key Programs:</h4>
                                    <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
                                        {college.programs.slice(0, 2).map(p => <li key={p}>{p}</li>)}
                                    </ul>
                                </div>
                                <button 
                                    onClick={() => fetchCollegeDetails(college)}
                                    className="mt-4 w-full bg-blue-600 text-white text-sm font-semibold py-2 rounded-lg hover:bg-blue-700 transition"
                                >
                                    View Details
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <Modal show={showCollegeModal} onClose={() => setShowCollegeModal(false)} title={selectedCollege?.name}>
                {isCollegeDetailsLoading ? <div className="flex flex-col justify-center items-center h-60"><Spinner /><p className="mt-2 text-sm text-gray-500">Our AI is gathering all the details...</p></div>
                : collegeDetails?.error ? <p className="text-red-500">{collegeDetails.error}</p>
                : collegeDetails && (
                    <div className="text-sm text-gray-700 dark:text-gray-300 max-h-[70vh] overflow-y-auto pr-2">
                        <p className="mb-4 italic">{collegeDetails.about}</p>
                        
                        <h4 className="font-bold text-lg text-gray-800 dark:text-white mb-2">Key Programs & Fees</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 mb-4">
                            {collegeDetails.programs?.map(p => (
                                <div key={p.name} className="bg-gray-100 dark:bg-gray-700 p-2 rounded-md mb-2">
                                    <p className="font-semibold">{p.name}</p>
                                    <p className="text-xs">{p.fees} ({p.duration})</p>
                                </div>
                            ))}
                        </div>

                        <h4 className="font-bold text-lg text-gray-800 dark:text-white mb-2">Admission Cutoffs</h4>
                        <table className="w-full text-left text-sm mb-4">
                            <thead className="bg-gray-100 dark:bg-gray-700">
                                <tr>
                                    <th className="p-2">Exam</th>
                                    <th className="p-2">Category</th>
                                    <th className="p-2">Closing Rank (Approx.)</th>
                                </tr>
                            </thead>
                            <tbody>
                            {collegeDetails.cutoffs?.map((c, i) => (
                                <tr key={i} className="border-b dark:border-gray-700">
                                    <td className="p-2">{c.exam}</td>
                                    <td className="p-2">{c.category}</td>
                                    <td className="p-2">{c.rank}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>

                        <h4 className="font-bold text-lg text-gray-800 dark:text-white mb-2">Admission Process</h4>
                        <p className="mb-4">{collegeDetails.admissionProcess}</p>
                        
                        <h4 className="font-bold text-lg text-gray-800 dark:text-white mb-2">Facilities</h4>
                        <div className="flex flex-wrap gap-2">
                            {collegeDetails.facilities?.map(f => <span key={f} className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-medium px-2.5 py-1 rounded-full">{f}</span>)}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

function ResourcesPage() {
    const { userProfile, isReady } = useContext(AppContext);
    const [selectedCareer, setSelectedCareer] = useState('');
    const [personalizedResources, setPersonalizedResources] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const recommendedCareers = useMemo(() => {
        const isQuizComplete = Object.keys(userProfile.quizAnswers || {}).length === quizQuestions.length;
        if (!isQuizComplete) return [];
        return getStaticRecommendation(userProfile.quizAnswers).careers;
    }, [userProfile.quizAnswers]);

    useEffect(() => {
        if (recommendedCareers.length > 0 && !selectedCareer) {
            setSelectedCareer(recommendedCareers[0]);
        }
    }, [recommendedCareers, selectedCareer]);

    const handleFetchResources = async () => {
        if (!selectedCareer) {
            setError("Please select a career path first.");
            return;
        }
        if (!GEMINI_API_KEY || GEMINI_API_KEY === "PASTE_YOUR_GEMINI_API_KEY_HERE") {
            setError("AI features are disabled. API Key is not configured.");
            return;
        }

        setLoading(true);
        setError('');
        setPersonalizedResources(null);

        try {
            const prompt = `Act as an expert career counselor in India. For a student interested in a "${selectedCareer}" career, generate a detailed educational and career roadmap. 
            The roadmap should include a timeline starting from after Class 12th and a course-to-career path mapping.
            Important: Respond ONLY with a valid JSON object with the following structure: 
            {
              "timeline": [
                {"year": "After Class 12th", "tasks": ["Task 1", "Task 2"]},
                {"year": "During Undergraduate", "tasks": ["Task 1", "Task 2"]},
                {"year": "After Graduation", "tasks": ["Task 1", "Task 2"]}
              ],
              "careerMap": [
                {"course": "Relevant Course 1", "paths": ["Job Role 1", "Job Role 2"]},
                {"course": "Relevant Course 2", "paths": ["Job Role 3", "Job Role 4"]}
              ]
            }`;

            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });

            if (!response.ok) throw new Error("API call failed.");
            const result = await response.json();
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
                const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
                const parsed = JSON.parse(cleanedText);
                setPersonalizedResources(parsed);
            } else { throw new Error("No content from API."); }

        } catch (error) {
            console.error("Error fetching personalized resources:", error);
            setError("Sorry, we couldn't generate a personalized roadmap. Please try again.");
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        if (selectedCareer) {
            handleFetchResources();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCareer]);

    if (!isReady) return <div className="p-8 flex justify-center"><Spinner /></div>;
    
    if (recommendedCareers.length === 0) {
        return <p className="p-8 text-center text-gray-500">Please complete the quiz on the Home page to unlock personalized resources.</p>;
    }

    return (
        <div className="p-4 md:p-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Personalized Career Roadmap</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Select one of your recommended career paths to see a detailed roadmap.</p>
                <div className="flex gap-4 items-center">
                     <select
                        value={selectedCareer}
                        onChange={(e) => setSelectedCareer(e.target.value)}
                        className="w-full md:w-1/3 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {recommendedCareers.map(career => <option key={career} value={career}>{career}</option>)}
                    </select>
                </div>
            </div>

            {error && <p className="p-8 text-center text-red-500">{error}</p>}
            
            {loading ? <div className="flex flex-col justify-center items-center h-60"><Spinner /><p className="mt-2 text-sm text-gray-500">Our AI is creating a custom roadmap for a {selectedCareer}...</p></div>
            : personalizedResources && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Timeline Tracker */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Timeline Tracker for {selectedCareer}</h2>
                        <div className="relative border-l-2 border-blue-200 dark:border-blue-700 ml-4">
                            {personalizedResources.timeline.map((item, index) => (
                                <div key={index} className="mb-8 ml-8">
                                    <span className="absolute flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full -left-4 ring-8 ring-white dark:ring-gray-800 dark:bg-blue-900">
                                        <svg className="w-4 h-4 text-blue-800 dark:text-blue-300" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path></svg>
                                    </span>
                                    <h3 className="flex items-center mb-1 text-lg font-semibold text-gray-900 dark:text-white">{item.year}</h3>
                                    <ul className="space-y-1 text-base font-normal text-gray-500 dark:text-gray-400 list-disc list-inside">
                                       {item.tasks.map((task, i) => <li key={i}>{task}</li>)}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Course-to-Career Path Mapping */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                         <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Course-to-Career Path for {selectedCareer}</h2>
                         <div className="space-y-4">
                             {personalizedResources.careerMap.map((item, index) => (
                                 <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                     <h3 className="font-bold text-gray-800 dark:text-white">{item.course}</h3>
                                     <div className="flex flex-wrap gap-2 mt-2">
                                        {item.paths.map(path => (
                                             <span key={path} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 text-xs font-medium px-2.5 py-1 rounded-full">{path}</span>
                                        ))}
                                     </div>
                                 </div>
                             ))}
                         </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function SettingsPage() {
    const { user, userProfile, saveUserProfile, isGuest } = useContext(AppContext);
    const [showModal, setShowModal] = useState(false);
    
    const handleLocationChange = (e) => {
        saveUserProfile({ location: e.target.value });
    };

    const handleDarkModeToggle = () => {
        const newDarkMode = !userProfile.darkMode;
        saveUserProfile({ darkMode: newDarkMode });
        if (newDarkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    };
    
    const handleResetQuiz = () => {
        saveUserProfile({ quizAnswers: {} });
        alert('Quiz data has been reset!');
    };
    
    const handleLogout = async () => {
         await signOut(auth);
    };

    return (
        <div className="p-4 md:p-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</h2>
                
                <div className="space-y-6">
                    <div>
                        <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300">College Location Filter</label>
                        <select
                            id="location"
                            value={userProfile.location || 'All'}
                            onChange={handleLocationChange}
                             className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        >
                            {indianStatesAndUTs.map(state => <option key={state} value={state}>{state}</option>)}
                        </select>
                    </div>

                    <div className="flex items-center justify-between">
                         <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Dark Mode</span>
                        <button
                            onClick={handleDarkModeToggle}
                            className={`${userProfile.darkMode ? 'bg-blue-600' : 'bg-gray-200'} relative inline-flex items-center h-6 rounded-full w-11 transition-colors`}
                        >
                            <span className={`${userProfile.darkMode ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}/>
                        </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                         <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Reset Quiz Data</span>
                        <button onClick={() => setShowModal(true)} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">Reset</button>
                    </div>
                    
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                         <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Account</h3>
                         <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Logged in as: {isGuest ? "Guest" : user?.email}</p>
                         <button onClick={handleLogout} className="w-full flex justify-center items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-700">
                             <IconLogout />
                             Logout
                         </button>
                    </div>
                </div>
            </div>

            <Modal show={showModal} onClose={() => setShowModal(false)} title="Confirm Reset">
                <p className="text-gray-600 dark:text-gray-300 mb-4">Are you sure you want to reset your quiz data? This action cannot be undone.</p>
                <div className="flex justify-end gap-4">
                    <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300">Cancel</button>
                    <button onClick={() => { handleResetQuiz(); setShowModal(false); }} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">Yes, Reset</button>
                </div>
            </Modal>
        </div>
    );
}


function MainApp() {
    const { userProfile } = useContext(AppContext);
    const [activePage, setActivePage] = useState('Home');

    const NavItem = ({ pageName, icon, children }) => (
        <button
            onClick={() => setActivePage(pageName)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activePage === pageName 
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200' 
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
        >
            {icon}
            <span className="hidden md:inline">{children}</span>
        </button>
    );

    return (
        <div className={`${userProfile.darkMode ? 'dark' : ''}`}>
             <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300">
                <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-10">
                    <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <div className="flex-shrink-0">
                                <h1 className="text-xl font-bold">Digital Guidance</h1>
                            </div>
                            <div className="flex items-center space-x-2 sm:space-x-4">
                               <NavItem pageName="Home" icon={<IconHome />}>Home</NavItem>
                               <NavItem pageName="Colleges" icon={<IconCollege />}>Colleges</NavItem>
                               <NavItem pageName="Resources" icon={<IconResources />}>Resources</NavItem>
                               <NavItem pageName="Settings" icon={<IconSettings />}>Settings</NavItem>
                            </div>
                        </div>
                    </nav>
                </header>
                <main>
                    {activePage === 'Home' && <HomePage />}
                    {activePage === 'Colleges' && <CollegesDirectory />}
                    {activePage === 'Resources' && <ResourcesPage />}
                    {activePage === 'Settings' && <SettingsPage />}
                </main>
            </div>
        </div>
    );
}

export default function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState({
        darkMode: false,
        location: 'All',
        quizAnswers: {}
    });

    useEffect(() => {
        if (!isConfigured) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            try {
                if (currentUser) {
                    setUser(currentUser);
                    const userDocRef = doc(db, 'users', currentUser.uid);
                    const docSnap = await getDoc(userDocRef);
                    if (docSnap.exists()) {
                        const profileData = docSnap.data();
                        setUserProfile(profileData);
                         if (profileData.darkMode) document.documentElement.classList.add('dark');
                         else document.documentElement.classList.remove('dark');
                    } else {
                        const defaultProfile = {
                            email: currentUser.email || 'guest',
                            location: 'All',
                            darkMode: false,
                            quizAnswers: {}
                        };
                        await setDoc(userDocRef, defaultProfile);
                        setUserProfile(defaultProfile);
                        document.documentElement.classList.remove('dark');
                    }
                } else {
                    setUser(null);
                    setUserProfile({ darkMode: false, location: 'All', quizAnswers: {} });
                    document.documentElement.classList.remove('dark');
                }
            } catch (error) {
                if (error.code === 'unavailable') {
                    console.warn("Firebase: Client is offline. App will use local/cached data.");
                } else {
                    console.error("Firebase Auth/Firestore Error:", error);
                }
                setUser(currentUser);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const saveUserProfile = useCallback(async (dataToSave) => {
        if (user) {
            const updatedProfile = { ...userProfile, ...dataToSave };
            setUserProfile(updatedProfile);
            const userDocRef = doc(db, 'users', user.uid);
            await setDoc(userDocRef, updatedProfile, { merge: true });
        }
    }, [user, userProfile]);
    
    const appContextValue = {
        user,
        userProfile,
        saveUserProfile,
        isGuest: user ? user.isAnonymous : false,
        isReady: !loading,
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                <Spinner />
            </div>
        );
    }
    
    return (
        <AppContext.Provider value={appContextValue}>
            {user ? <MainApp /> : <LoginPage />}
        </AppContext.Provider>
    );
}


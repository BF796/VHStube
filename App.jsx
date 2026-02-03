import React, { useState, useEffect, useContext, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';

// --- FIREBASE SETUP ---
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, query, orderBy } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// --- ICONS ---
import { FaVideo, FaSearch, FaUserCircle, FaBars, FaHome, FaFire } from 'react-icons/fa';
import { MdVideoLibrary } from 'react-icons/md';
import { BiSolidLike } from "react-icons/bi";

// *** IMPORTANT: REPLACE WITH YOUR OWN FIREBASE CONFIG!!! ***
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// --- AUTH CONTEXT ---
// This lets the whole app know if a user is logged in
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, signInWithGoogle, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);


// --- COMPONENTS ---

// The Top Navigation Bar
const Navbar = () => {
  const { user, signInWithGoogle, logout } = useAuth();

  return (
    <nav className="flex justify-between items-center p-4 bg-vhsDark sticky top-0 z-50 border-b border-vhsLightGray">
        <div className="flex items-center gap-4">
            <FaBars className="text-xl cursor-pointer" />
            {/* THE NAME VHStube */}
            <Link to="/" className="flex items-center gap-1">
                <FaVideo className="text-vhsRed text-2xl" />
                <span className="text-xl font-bold tracking-tighter">VHStube</span>
            </Link>
        </div>

        {/* Search Bar (Visual only for demo) */}
        <div className="hidden md:flex items-center bg-[#121212] border border-[#303030] rounded-full w-1/3 overflow-hidden">
            <input type="text" placeholder="Rechercher" className="w-full bg-transparent p-2 px-4 outline-none" />
            <button className="bg-[#222222] p-3 px-5 border-l border-[#303030] hover:bg-[#303030] transition">
                <FaSearch />
            </button>
        </div>

        <div className="flex items-center gap-4">
            {/* Upload Button - Shows only if logged in */}
            {user && (
                <Link to="/upload">
                   <FaVideo className="text-2xl cursor-pointer hover:text-vhsRed transition" title="Create" />
                </Link>
            )}

            {/* Sign In Button or User Profile */}
            {user ? (
                <div className="flex items-center gap-2 cursor-pointer" onClick={logout} title="Click to logout">
                    <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full" />
                </div>
            ) : (
                <button
                    onClick={signInWithGoogle}
                    className="flex items-center gap-2 text-blue-400 border border-blue-400 px-3 py-1.5 rounded-full font-medium hover:bg-blue-400/10 transition"
                >
                    <FaUserCircle className="text-xl" /> Sign In
                </button>
            )}
        </div>
    </nav>
  );
};

// Sidebar (Visual placeholder)
const Sidebar = () => {
    return (
        <aside className="hidden md:block w-64 bg-vhsDark h-[calc(100vh-64px)] fixed overflow-y-auto p-2">
            <SidebarItem icon={<FaHome />} text="Accueil" active />
            <SidebarItem icon={<FaFire />} text="Shorts" />
            <SidebarItem icon={<MdVideoLibrary />} text="Abonnements" />
            <hr className="border-vhsLightGray my-4" />
            <SidebarItem icon={<MdVideoLibrary />} text="Vous" />
        </aside>
    )
}

const SidebarItem = ({icon, text, active}) => (
    <div className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer hover:bg-vhsLightGray transition ${active ? 'bg-vhsLightGray' : ''}`}>
        <span className="text-xl">{icon}</span>
        <span>{text}</span>
    </div>
)

// Video Card for Home Page
const VideoCard = ({ video, id }) => {
  return (
    <Link to={`/watch/${id}`} className="flex flex-col gap-2 cursor-pointer group">
      {/* Using a static placeholder image because generating realistic thumbnails from raw video files on the frontend is complex */}
      <div className="relative aspect-video rounded-xl overflow-hidden bg-vhsLightGray">
        <img 
            src={video.thumbnailUrl || "https://via.placeholder.com/640x360/000000/ffffff?text=VHStube+Video"} 
            alt={video.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition duration-200" 
        />
      </div>
      <div className="flex gap-3">
        <img src={video.uploaderPhoto} alt={video.uploaderName} className="w-9 h-9 rounded-full mt-1" />
        <div>
            <h3 className="font-semibold leading-tight line-clamp-2">{video.title}</h3>
            <p className="text-sm text-gray-400 mt-1 hover:text-white transition">{video.uploaderName}</p>
            <p className="text-sm text-gray-400">{new Date(video.createdAt?.toDate()).toLocaleDateString()}</p>
        </div>
      </div>
    </Link>
  );
};

// --- PAGES ---

// HomePage: Fetches and displays videos
const HomePage = () => {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    const fetchVideos = async () => {
        const q = query(collection(db, "videos"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        setVideos(querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    };

    fetchVideos();
  }, []);

  return (
    <div className="p-4 md:ml-64">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-8">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} id={video.id} />
        ))}
      </div>
      {videos.length === 0 && <p className="text-center mt-10 text-gray-400">No videos found on VHStube yet. Be the first to upload!</p>}
    </div>
  );
};

// UploadPage: Allows authenticated users to upload videos
const UploadPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
      if (!user) navigate('/');
  }, [user, navigate]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!videoFile || !title || !user) return;

    setUploading(true);
    try {
      // 1. Upload file to Firebase Storage
      const storageRef = ref(storage, `videos/${Date.now()}_${videoFile.name}`);
      const snapshot = await uploadBytes(storageRef, videoFile);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // 2. Save video metadata to Firestore database
      await addDoc(collection(db, "videos"), {
        title: title,
        videoUrl: downloadURL,
        // Using a static placeholder thumbnail for simplicity in this demo
        thumbnailUrl: "https://via.placeholder.com/640x360/000000/ffffff?text=VHStube+Video", 
        uploaderId: user.uid,
        uploaderName: user.displayName,
        uploaderPhoto: user.photoURL,
        createdAt: new Date(),
      });

      alert("Video uploaded successfully to VHStube!");
      navigate('/'); // Go back home to see the video

    } catch (error) {
      console.error("Error uploading: ", error);
      alert("Upload failed.");
    }
    setUploading(false);
  };

  return (
    <div className="flex justify-center items-center h-[calc(100vh-64px)] md:ml-64 bg-vhsDark">
      <form onSubmit={handleUpload} className="bg-vhsLightGray p-8 rounded-xl shadow-lg w-full max-w-md flex flex-col gap-4">
        <h2 className="text-2xl font-bold mb-4">Upload to VHStube</h2>
        
        <input
          type="text"
          placeholder="Video Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="p-3 bg-[#121212] border border-[#303030] rounded outline-none focus:border-blue-500 transition"
          required
        />
        
        <label className="flex flex-col gap-2">
            <span className="text-sm text-gray-400">Select Video File (MP4, WebM)</span>
            <input
            type="file"
            accept="video/*"
            onChange={(e) => setVideoFile(e.target.files[0])}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-vhsRed/10 file:text-vhsRed hover:file:bg-vhsRed/20 cursor-pointer"
            required
            />
        </label>

        <button
          type="submit"
          disabled={uploading}
          className={`mt-4 p-3 rounded font-bold uppercase transition ${uploading ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {uploading ? 'Uploading...' : 'Publish Video'}
        </button>
      </form>
    </div>
  );
};

// WatchPage: Plays a specific video
const WatchPage = () => {
  const { id } = useParams();
  const [videoData, setVideoData] = useState(null);

  useEffect(() => {
    const fetchVideo = async () => {
      const docRef = doc(db, "videos", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setVideoData(docSnap.data());
      }
    };
    fetchVideo();
  }, [id]);

  if (!videoData) return <div className="text-center mt-20 md:ml-64">Loading VHStube tape...</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 md:ml-64">
      {/* Main Player Section */}
      <div className="flex-1">
        <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-xl relative">
          {/* Standard HTML5 Video Player */}
          <video 
              src={videoData.videoUrl} 
              controls 
              autoPlay 
              className="w-full h-full"
          >
               Your browser does not support the video tag.
          </video>
        </div>

        <h1 className="text-xl font-bold mt-4">{videoData.title}</h1>
        
        <div className="flex justify-between items-center mt-2 pb-4 border-b border-vhsLightGray">
            <div className="flex items-center gap-3">
                <img src={videoData.uploaderPhoto} alt="" className="w-10 h-10 rounded-full" />
                <div>
                    <h3 className="font-bold">{videoData.uploaderName}</h3>
                    <p className="text-sm text-gray-400">Uploaded on {new Date(videoData.createdAt?.toDate()).toLocaleDateString()}</p>
                </div>
                <button className="ml-4 bg-vhsText text-vhsDark px-4 py-2 rounded-full font-medium">
                    S'abonner
                </button>
            </div>
            <div className="flex items-center gap-2 bg-vhsLightGray rounded-full overflow-hidden">
                 <button className="flex items-center gap-2 px-4 py-2 hover:bg-[#3a3a3a] transition border-r border-[#3a3a3a]">
                    <BiSolidLike className="text-xl" /> Like
                 </button>
                 <button className="px-4 py-2 hover:bg-[#3a3a3a] transition">
                    Dislike
                 </button>
            </div>
        </div>
      </div>

      {/* Sidebar recommendations (static for demo) */}
      <div className="lg:w-[400px] flex flex-col gap-3">
          {/* In a real app, you would fetch related videos here */}
          <div className="h-24 bg-vhsLightGray rounded-xl flex justify-center items-center text-gray-500">Related Video Placeholder 1</div>
          <div className="h-24 bg-vhsLightGray rounded-xl flex justify-center items-center text-gray-500">Related Video Placeholder 2</div>
          <div className="h-24 bg-vhsLightGray rounded-xl flex justify-center items-center text-gray-500">Related Video Placeholder 3</div>
      </div>
    </div>
  );
};

// --- MAIN APP WRAPPER ---
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-vhsDark text-vhsText font-sans">
          <Navbar />
          <div className="flex">
            <Sidebar />
            <main className="flex-1">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/upload" element={<UploadPage />} />
                    <Route path="/watch/:id" element={<WatchPage />} />
                </Routes>
            </main>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  UploadCloud,
  Search,
  Download,
  X,
  Image as ImageIcon,
  LoaderCircle,
  ServerCrash,
} from "lucide-react";

// --- Configuration ---
const UPLOAD_API_URL =
  process.env.REACT_APP_UPLOAD_API_URL || "http://localhost:8080";
const DOWNLOAD_API_URL =
  process.env.REACT_APP_DOWNLOAD_API_URL || "http://localhost:8081";

// --- API Helper Functions ---
const api = {
  uploadImage: async (title, file) => {
    const formData = new FormData();
    formData.append("title", title);
    formData.append("file", file);

    const response = await fetch(`${UPLOAD_API_URL}/command`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Upload failed: ${errorBody || response.statusText}`);
    }
    return { success: true };
  },
  getMetadata: async () => {
    const response = await fetch(`${DOWNLOAD_API_URL}/query/metadata`);
    if (!response.ok) throw new Error("Failed to fetch metadata");
    return response.json();
  },
  getImageUrl: (imageId, resolution) => {
    return `${DOWNLOAD_API_URL}/query/images/${imageId}/${resolution}`;
  },
};

// --- Child Components ---

const Notification = ({ message, type, onDismiss }) => {
  if (!message) return null;

  const baseClasses =
    "fixed top-5 right-5 p-4 rounded-lg shadow-lg flex items-center z-50 animate-fade-in-down";
  const typeClasses = {
    success: "bg-green-500 text-white",
    error: "bg-red-500 text-white",
    info: "bg-blue-500 text-white",
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]}`}>
      <p className="mr-4">{message}</p>
      <button
        onClick={onDismiss}
        className="p-1 rounded-full hover:bg-white/20"
      >
        <X size={18} />
      </button>
    </div>
  );
};

const UploadForm = ({ onUploadSuccess }) => {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title) {
      setError("Both title and a file are required.");
      return;
    }
    setIsUploading(true);
    setError("");

    try {
      await api.uploadImage(title, file);
      onUploadSuccess(
        `'${title}' uploaded successfully! Refreshing gallery...`
      );
      setTitle("");
      setFile(null);
      e.target.reset();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError("");
    }
  };

  return (
    <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl mb-12 border border-gray-700">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        Upload New Image
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Image Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            placeholder="e.g., Sunset over the mountains"
            disabled={isUploading}
          />
        </div>
        <div>
          <label
            htmlFor="file-upload"
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              dragActive
                ? "border-indigo-500 bg-gray-700"
                : "border-gray-600 bg-gray-700/50 hover:bg-gray-700"
            }`}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-400">
              <UploadCloud size={40} className="mb-3" />
              {file ? (
                <p className="font-semibold text-indigo-400">{file.name}</p>
              ) : (
                <>
                  <p className="mb-2 text-sm">
                    <span className="font-semibold">Click to upload</span> or
                    drag and drop
                  </p>
                  <p className="text-xs">PNG, JPG, GIF, etc.</p>
                </>
              )}
            </div>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </label>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={isUploading || !file || !title}
          className="w-full flex justify-center items-center bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-300"
        >
          {isUploading ? (
            <>
              <LoaderCircle className="animate-spin mr-2" size={20} />
              Uploading...
            </>
          ) : (
            "Upload Image"
          )}
        </button>
      </form>
    </div>
  );
};

const ImageCard = ({ metadata, onImageSelect }) => {
  const preferredThumbResolutions = ["480p", "720p", "1080p", "ORIGINAL"];
  const thumbResolution =
    metadata.resolutions.find((r) => preferredThumbResolutions.includes(r)) ||
    metadata.resolutions[0];
  const imageUrl = useMemo(
    () => api.getImageUrl(metadata.imgId, thumbResolution),
    [metadata.imgId, thumbResolution]
  );

  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div
      className="bg-gray-800 rounded-xl overflow-hidden shadow-lg group relative cursor-pointer transform hover:-translate-y-2 transition-transform duration-300"
      onClick={() => onImageSelect(metadata)}
    >
      <div className="aspect-w-16 aspect-h-9 w-full bg-gray-700">
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <LoaderCircle className="animate-spin text-gray-500" />
          </div>
        )}
        <img
          src={imageUrl}
          alt={metadata.title}
          className={`w-full h-full object-cover transition-opacity duration-500 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setIsLoaded(true)}
          onError={(e) => {
            e.target.src =
              "https://placehold.co/600x400/1F2937/FFFFFF?text=Error";
          }}
        />
      </div>
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
        <h3 className="text-white font-bold text-lg truncate">
          {metadata.title}
        </h3>
        <p className="text-gray-300 text-sm truncate">{metadata.imgId}</p>
      </div>
    </div>
  );
};

const ImageDetailModal = ({ metadata, onClose }) => {
  const previewUrl = useMemo(() => {
    if (!metadata) {
      return null;
    }
    const preferredPreviewResolution = ["720p", "1080p", "480p", "ORIGINAL"];
    const previewResolution =
      metadata.resolutions.find((r) =>
        preferredPreviewResolution.includes(r)
      ) || metadata.resolutions[0];
    return api.getImageUrl(metadata.imgId, previewResolution);
  }, [metadata]);

  if (!metadata) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full md:w-2/3 bg-black flex items-center justify-center p-4">
          <img
            src={previewUrl}
            alt={metadata.title}
            className="max-w-full max-h-[80vh] object-contain"
          />
        </div>
        <div className="w-full md:w-1/3 p-6 flex flex-col">
          <div className="flex-grow overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-2">
              {metadata.title}
            </h2>
            <p className="text-sm text-gray-400 mb-6 break-all">
              ID: {metadata.imgId}
            </p>

            <h3 className="text-lg font-semibold text-white mb-3">
              Available Resolutions
            </h3>
            <div className="space-y-3">
              {metadata.resolutions.map((res) => (
                <a
                  key={res}
                  href={api.getImageUrl(metadata.imgId, res)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between bg-gray-700 p-3 rounded-lg hover:bg-indigo-600 group transition-colors"
                >
                  <span className="font-medium text-gray-200 group-hover:text-white">
                    {res}
                  </span>
                  <Download
                    size={20}
                    className="text-gray-400 group-hover:text-white"
                  />
                </a>
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            className="mt-6 w-full bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/80"
      >
        <X size={24} />
      </button>
    </div>
  );
};

// --- Main App Component ---

export default function App() {
  const [allImages, setAllImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [notification, setNotification] = useState({ message: "", type: "" });

  const fetchImages = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const metadataList = await api.getMetadata();
      const groupedByImgId = metadataList.flat().reduce((acc, meta) => {
        if (!acc[meta.imgId]) {
          acc[meta.imgId] = {
            imgId: meta.imgId,
            title: meta.title,
            resolutions: [],
          };
        }
        acc[meta.imgId].resolutions.push(meta.resolution);
        return acc;
      }, {});
      const sortedImages = Object.values(groupedByImgId).sort((a, b) =>
        b.imgId.localeCompare(a.imgId)
      );
      setAllImages(sortedImages);
    } catch (err) {
      setError(
        "Could not connect to the backend. Please ensure the server is running and accessible."
      );
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleUploadSuccess = (message) => {
    showNotification(message, "success");
    setTimeout(fetchImages, 2000);
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: "", type: "" }), 5000);
  };

  const displayedImages = useMemo(() => {
    if (!searchQuery) {
      return allImages.slice(0, 8);
    }
    return allImages.filter(
      (image) =>
        image.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        image.imgId.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allImages, searchQuery]);

  return (
    <div className="bg-gray-900 min-h-screen text-gray-100 font-sans">
      <Notification
        message={notification.message}
        type={notification.type}
        onDismiss={() => setNotification({ message: "", type: "" })}
      />
      <ImageDetailModal
        metadata={selectedImage}
        onClose={() => setSelectedImage(null)}
      />

      <main className="container mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-white tracking-tight">
            Image Transcoder <span className="text-indigo-500">Gallery</span>
          </h1>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Upload your images and get them transcoded into multiple resolutions
            on the fly.
          </p>
        </header>

        <UploadForm onUploadSuccess={handleUploadSuccess} />

        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title or image ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>
        </div>

        <div>
          {isLoading && (
            <div className="flex justify-center items-center py-20">
              <LoaderCircle
                size={48}
                className="animate-spin text-indigo-500"
              />
            </div>
          )}
          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center">
              <div className="flex justify-center items-center">
                <ServerCrash className="mr-3" />
                <p>
                  <strong>Error:</strong> {error}
                </p>
              </div>
            </div>
          )}
          {!isLoading &&
            !error &&
            (displayedImages.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {displayedImages.map((meta) => (
                  <ImageCard
                    key={meta.imgId}
                    metadata={meta}
                    onImageSelect={setSelectedImage}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-gray-500">
                <ImageIcon size={48} className="mx-auto mb-4" />
                <h3 className="text-xl font-semibold">No images found</h3>
                <p>
                  {searchQuery
                    ? "No images match your search term."
                    : "Upload an image to get started."}
                </p>
              </div>
            ))}
        </div>
      </main>

      <footer className="text-center py-6 text-gray-500 text-sm">
        <p>Powered by Spring Boot & React. Designed by Gemini.</p>
      </footer>
    </div>
  );
}

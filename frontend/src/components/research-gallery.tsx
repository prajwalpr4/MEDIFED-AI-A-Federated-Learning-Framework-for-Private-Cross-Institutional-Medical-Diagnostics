"use client";

import React, { useState } from "react";
import { Image as ImageIcon, Maximize2, X, Sparkles } from "lucide-react";

interface GalleryItem {
  id: number;
  filename: string;
  title: string;
  subtitle: string;
}

const DEFAULT_GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 1,
    filename: "image1.jpeg",
    title: "Client-Wise Performance Metrics",
    subtitle: "Accuracy, Precision, Recall & F1 across Kaggle, Chittagong & Bhopal cohorts",
  },
  {
    id: 2,
    filename: "image2.jpeg",
    title: "Pooled Confusion Matrix (Round 3)",
    subtitle: "Global test cohort evaluation (N=1,247 cases: 444 TN, 91 FP, 141 FN, 571 TP)",
  },
  {
    id: 3,
    filename: "image3.jpeg",
    title: "Global Convergence Trajectory",
    subtitle: "Validation vs. Test Accuracy & F1-Score progression across federated rounds",
  },
  {
    id: 4,
    filename: "image4.jpeg",
    title: "Latent Feature PCA Projection",
    subtitle: "ResNet-50 2048-d feature space (PC1: 38.1% vs PC2: 13.6% variance)",
  },
  {
    id: 5,
    filename: "image5.jpeg",
    title: "Global Performance Across Rounds",
    subtitle: "Progression of Accuracy, Precision, Recall, and F1 over Federated Rounds 1–3",
  },
  {
    id: 6,
    filename: "image6.jpeg",
    title: "Latent Feature t-SNE Clustering",
    subtitle: "High-dimensional manifold embedding separating Normal from Pneumonia cases",
  },
];

export function ResearchGallery() {
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);

  return (
    <section className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-[#102A43] text-xs font-bold border border-slate-200">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>RESEARCH VISUALIZATION EXHIBITS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#102A43]">
            Empirical Results & Visualizations
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Experimental analysis, latent space distribution, and evaluation artifacts across participating clinical silos.
          </p>
        </div>

        {/* 6 Images Grid: Side-by-Side Responsive Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {DEFAULT_GALLERY_ITEMS.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedImage(item)}
              className="group bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex flex-col"
            >
              {/* Image Frame */}
              <div className="relative aspect-[4/3] bg-white border-b border-slate-200 flex items-center justify-center overflow-hidden">
                <img
                  src={`/overview-images/${item.filename}`}
                  alt={item.title}
                  onError={(e) => {
                    // Fallback to placeholder if file not yet copied
                    const target = e.currentTarget;
                    target.style.display = "none";
                    if (target.nextElementSibling) {
                      (target.nextElementSibling as HTMLElement).style.display = "flex";
                    }
                  }}
                  className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                />

                {/* Placeholder shown if image file is not yet placed in folder */}
                <div className="hidden absolute inset-0 flex-col items-center justify-center p-4 text-center text-slate-400 space-y-2 bg-slate-50">
                  <div className="w-10 h-10 rounded-xl bg-slate-200/80 flex items-center justify-center text-slate-500">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">
                      {item.title}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Visualization Exhibit
                    </span>
                  </div>
                </div>

                {/* Hover overlay hint */}
                <div className="absolute inset-0 bg-[#102A43]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <div className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-xs font-semibold flex items-center gap-1.5 shadow-sm">
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>View Full Size</span>
                  </div>
                </div>
              </div>

              {/* Caption */}
              <div className="p-4 bg-white flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-[#102A43] group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal for Full-Size Viewing */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-[#102A43]">
                  {selectedImage.title}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  {selectedImage.subtitle}
                </p>
              </div>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Image Display */}
            <div className="p-6 bg-slate-900 flex items-center justify-center overflow-auto flex-1 min-h-[300px]">
              <img
                src={`/overview-images/${selectedImage.filename}`}
                alt={selectedImage.title}
                className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

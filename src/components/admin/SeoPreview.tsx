"use client";

import { useState } from "react";
import { Globe, Twitter } from "lucide-react";

interface Props {
  title: string;
  description: string;
  slug: string;
  image?: string;
  siteName?: string;
}

export function SeoPreview({ title, description, slug, image, siteName = "persicore.ir" }: Props) {
  const [tab, setTab] = useState<"google" | "og">("google");

  const displayTitle = title || "عنوان پست";
  const displayDesc = description || "توضیح مختصر پست بلاگ...";
  const displaySlug = slug || "post-slug";
  const url = `blog.persicore.ir/${displaySlug}`;

  return (
    <div className="space-y-3">
      {/* Tab switcher */}
      <div className="flex gap-2">
        {(["google", "og"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
              tab === t ? "bg-violet-600/20 text-violet-300 border border-violet-500/30" : "text-white/40 hover:text-white border border-white/10"
            }`}>
            {t === "google" ? "🔍 Google SERP" : "🐦 Open Graph"}
          </button>
        ))}
      </div>

      {/* Google Preview */}
      {tab === "google" && (
        <div className="bg-white rounded-xl p-4 font-sans" dir="ltr">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
              <Globe className="w-3 h-3 text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-800 font-medium">{siteName}</p>
              <p className="text-[10px] text-gray-500">{url}</p>
            </div>
          </div>
          <h3 className="text-lg text-blue-700 hover:underline cursor-pointer leading-tight mb-1"
            style={{ maxWidth: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {displayTitle.length > 60 ? displayTitle.slice(0, 60) + "..." : displayTitle}
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed" style={{ maxWidth: 600 }}>
            {displayDesc.length > 155 ? displayDesc.slice(0, 155) + "..." : displayDesc}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className={`text-[10px] font-medium ${displayTitle.length > 60 ? "text-red-500" : "text-green-600"}`}>
              عنوان: {displayTitle.length}/60 کاراکتر
            </span>
            <span className={`text-[10px] font-medium ${displayDesc.length > 155 ? "text-red-500" : "text-green-600"}`}>
              توضیح: {displayDesc.length}/155 کاراکتر
            </span>
          </div>
        </div>
      )}

      {/* OG Preview */}
      {tab === "og" && (
        <div className="bg-[#1a1a2e] rounded-xl overflow-hidden border border-white/10" dir="ltr">
          {image ? (
            <img src={image} alt="" className="w-full h-40 object-cover" />
          ) : (
            <div className="w-full h-40 bg-gradient-to-br from-violet-900/50 to-fuchsia-900/50 flex items-center justify-center">
              <Globe className="w-12 h-12 text-white/20" />
            </div>
          )}
          <div className="p-3">
            <p className="text-[10px] text-white/30 uppercase tracking-wide">{siteName}</p>
            <h3 className="text-sm font-bold text-white mt-1 leading-tight">{displayTitle}</h3>
            <p className="text-[11px] text-white/50 mt-1 line-clamp-2">{displayDesc}</p>
          </div>
        </div>
      )}
    </div>
  );
}

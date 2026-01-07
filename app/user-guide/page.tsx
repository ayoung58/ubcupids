"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, BookOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function UserGuidePage() {
  const [content, setContent] = useState("");
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    // Fetch the markdown guide
    fetch("/guide.md")
      .then((res) => res.text())
      .then((text) => setContent(text))
      .catch((err) => console.error("Failed to load guide:", err));

    // Handle scroll for active section highlighting
    const handleScroll = () => {
      const sections = document.querySelectorAll("h2[id]");
      let current = "";

      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 150 && rect.bottom >= 0) {
          current = section.id;
        }
      });

      if (current) {
        setActiveSection(current);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Check initial position

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Extract table of contents from markdown
  const tableOfContents = content
    .split("\n")
    .filter(
      (line) => line.startsWith("## ") && !line.includes("Table of Contents")
    )
    .map((line) => {
      const title = line.replace("## ", "");
      const id = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      return { title, id };
    });

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // Account for fixed header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 relative min-h-[72px]">
          {/* Logo - Centered */}
          <div className="flex justify-center">
            <Link
              href="/"
              className="text-3xl font-bold text-slate-900 hover:text-slate-700 transition-colors"
            >
              💘 UBCupids
            </Link>
          </div>

          {/* Back Button - Left Side */}
          <div className="absolute top-4 left-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-slate-700 hover:text-slate-900"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Home</span>
            </Link>
          </div>

          {/* Page Title - Right Side */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-pink-500" />
            <h1 className="text-2xl font-bold text-slate-900">User Guide</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Table of Contents */}
          <aside className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-4">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                  Table of Contents
                </h2>
                <nav className="space-y-2">
                  {tableOfContents.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        activeSection === item.id
                          ? "bg-pink-100 text-pink-700 font-medium"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {item.title}
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </aside>

          {/* Main Guide Content */}
          <main className="lg:col-span-3">
            <Card>
              <CardContent className="p-8">
                <div
                  className="prose prose-slate max-w-none
                    prose-headings:scroll-mt-24
                    prose-h1:text-4xl prose-h1:font-bold prose-h1:text-slate-900 prose-h1:mb-4
                    prose-h2:text-2xl prose-h2:font-bold prose-h2:text-slate-900 prose-h2:mt-8 prose-h2:mb-4 prose-h2:border-b prose-h2:border-slate-200 prose-h2:pb-2
                    prose-h3:text-xl prose-h3:font-semibold prose-h3:text-slate-800 prose-h3:mt-6 prose-h3:mb-3
                    prose-p:text-slate-700 prose-p:leading-relaxed prose-p:mb-4
                    prose-a:text-pink-600 prose-a:no-underline hover:prose-a:underline
                    prose-strong:text-slate-900 prose-strong:font-semibold
                    prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6
                    prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6
                    prose-li:text-slate-700 prose-li:my-2
                    prose-code:text-pink-600 prose-code:bg-pink-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                    prose-blockquote:border-l-4 prose-blockquote:border-pink-300 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-slate-600
                    prose-hr:my-8 prose-hr:border-slate-200"
                >
                  <ReactMarkdown
                    components={{
                      h2: ({ ...props }) => (
                        <h2
                          id={props.children
                            ?.toString()
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, "-")
                            .replace(/(^-|-$)/g, "")}
                          {...props}
                        />
                      ),
                    }}
                  >
                    {content}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}

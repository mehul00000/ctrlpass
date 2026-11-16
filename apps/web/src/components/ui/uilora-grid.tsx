"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FAQItem {
    q: string;
    a: string;
}

interface UiloraGridProps {
    faqs?: FAQItem[];
    title?: string;
    subtitle?: string;
    accentColor?: string;
}

const defaultFaqs: FAQItem[] = [
    { q: "What is Uilora?", a: "A premium React & Next.js UI component library with 700+ animated components." },
    { q: "What is the cost of using Uilora?", a: "Uilora is completely free and open source under the MIT license." },
    { q: "What frameworks does Uilora support?", a: "Next.js, React, React Native with Expo, and any Tailwind CSS project." },
    { q: "How are updates managed?", a: "Components are copy-paste — you own the code. Updates are opt-in via the CLI." },
    { q: "How does the Uilora CLI work?", a: "Run npx uilora@latest add [name] to install any component with its dependencies." },
    { q: "Can I use Uilora with TypeScript?", a: "Yes, all components ship with full TypeScript definitions and strict mode support." },
    { q: "What platforms can I build for?", a: "Web apps with Next.js/React and mobile apps with React Native and Expo." },
    { q: "Does Uilora have a playground?", a: "Yes, the Uilora Playground lets you test components with live prop editing." },
    { q: "How do I get started with Uilora?", a: "Visit uilora.com/get-started for installation guides and documentation." },
];

const FAQCell = ({
    faq,
    isOpen,
    onClick,
    accentColor,
}: {
    faq: FAQItem;
    isOpen: boolean;
    onClick: () => void;
    accentColor: string;
}) => (
    <div className="py-6" style={{ borderBottom: "1px solid #e8e8e8" }}>
        <button
            onClick={onClick}
            className="flex items-start gap-4 w-full text-left cursor-pointer group"
        >
            <span
                className="mt-1 flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] leading-none"
                style={{ backgroundColor: accentColor }}
            >
                <svg width="12" height="11" viewBox="0 0 12 11" fill="currentColor">
                    <path d="M6 10.5L0.8 4.5C-0.3 3.1 0.7 1 2.5 1C3.7 1 4.7 1.7 5.3 2.7L6 3.8L6.7 2.7C7.3 1.7 8.3 1 9.5 1C11.3 1 12.3 3.1 11.2 4.5L6 10.5Z" />
                </svg>
            </span>
            <span
                className="text-lg md:text-xl font-semibold font-serif leading-snug"
                style={{ color: accentColor }}
            >
                {faq.q}
            </span>
        </button>

        <AnimatePresence initial={false}>
            {isOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                    className="overflow-hidden"
                >
                    <p className="pt-4 pl-11 text-base leading-relaxed" style={{ color: "#666666" }}>
                        {faq.a}
                    </p>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
);

const UiloraGrid: React.FC<UiloraGridProps> = ({
    faqs = defaultFaqs,
    title = "Frequently Asked Questions",
    subtitle = "Everything you need to know about Uilora.",
    accentColor = "#1a1a1a",
}) => {
    const [openRow, setOpenRow] = useState<number | null>(null);

    // Pair items into rows: [left, right?]
    const rows: [FAQItem, FAQItem | undefined][] = [];
    for (let i = 0; i < faqs.length; i += 2) {
        rows.push([faqs[i], faqs[i + 1]]);
    }

    const toggleRow = (rowIndex: number) => {
        setOpenRow(openRow === rowIndex ? null : rowIndex);
    };

    return (
        <div className="w-full min-h-screen py-24 px-6 md:px-12 lg:px-24" style={{ backgroundColor: "#ffffff" }}>
            <div className="max-w-6xl mx-auto">
                <div className="mb-16">
                    <h2
                        className="text-5xl md:text-6xl font-bold font-serif leading-tight"
                        style={{ color: accentColor }}
                    >
                        {title}
                    </h2>
                    {subtitle && (
                        <p className="mt-4 text-lg" style={{ color: "#999999" }}>
                            {subtitle}
                        </p>
                    )}
                </div>

                <div className="space-y-0">
                    {rows.map((row, rowIdx) => (
                        <div key={rowIdx} className="grid grid-cols-1 md:grid-cols-2 gap-x-16">
                            <FAQCell
                                faq={row[0]}
                                isOpen={openRow === rowIdx}
                                onClick={() => toggleRow(rowIdx)}
                                accentColor={accentColor}
                            />
                            {row[1] && (
                                <FAQCell
                                    faq={row[1]}
                                    isOpen={openRow === rowIdx}
                                    onClick={() => toggleRow(rowIdx)}
                                    accentColor={accentColor}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default UiloraGrid;

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Hexagon } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Types ---
type FileStatus = 'idle' | 'uploading' | 'success' | 'error';

interface UploadedFile {
    file: File;
    id: string;
    preview?: string;
    status: FileStatus;
    progress: number;
}

interface FileUploadProps {
    variant?: 'neon-grid' | 'holographic' | 'orbital' | 'scanner' | 'liquid' | 'minimal-glass' | 'quantum' | 'cyber-stack';
    theme?: 'dark' | 'light';
    accentColor?: string;
    maxFiles?: number;
    accept?: Record<string, string[]>;
    onUpload?: (files: File[]) => void;
    disabled?: boolean;
}

// --- Hook for Logic ---
const useFileUploadLogic = ({
    maxFiles = 5,
    onUpload,
    disabled
}: FileUploadProps) => {
    const [files, setFiles] = useState<UploadedFile[]>([]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (disabled) return;

        const newFiles = acceptedFiles.map(file => ({
            file,
            id: Math.random().toString(36).substring(7),
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
            status: 'idle' as FileStatus,
            progress: 0
        }));

        setFiles(prev => [...prev, ...newFiles].slice(0, maxFiles));

        // Simulate Upload
        newFiles.forEach(f => {
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 10;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);
                    setFiles(curr => curr.map(item => item.id === f.id ? { ...item, status: 'success', progress: 100 } : item));
                } else {
                    setFiles(curr => curr.map(item => item.id === f.id ? { ...item, status: 'uploading', progress } : item));
                }
            }, 200);
        });

        if (onUpload) onUpload(acceptedFiles);
    }, [maxFiles, disabled, onUpload]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxFiles,
        disabled,
        accept: {
            'image/*': [],
            'application/pdf': [],
            'video/*': [],
            'audio/*': []
        }
    });

    return { files, getRootProps, getInputProps, isDragActive };
};

// QUANTUM (Circular Progress)
export const QuantumUpload = (props: FileUploadProps) => {
    const { files, getRootProps, getInputProps, isDragActive } = useFileUploadLogic(props);
    const activeFile = files.find(f => f.status === 'uploading') || files[files.length - 1];
    const progress = activeFile ? activeFile.progress : 0;

    return (
        <div {...(getRootProps() as unknown as React.HTMLAttributes<HTMLDivElement>)} className="w-full flex flex-col items-center justify-center py-4 cursor-pointer">
            <input {...getInputProps()} />
            <div className="relative w-40 h-40">
                <svg className="w-full h-full -rotate-90">
                    <circle cx="80" cy="80" r="76" fill="transparent" stroke="#1e293b" strokeWidth="4" />
                    <motion.circle
                        cx="80" cy="80" r="76" fill="transparent" stroke="#8b5cf6" strokeWidth="8" strokeLinecap="round"
                        strokeDasharray="477"
                        animate={{ strokeDashoffset: 477 - (477 * progress) / 100 }}
                        initial={{ strokeDashoffset: 477 }}
                        className="drop-shadow-[0_0_15px_rgba(139,92,246,0.6)]"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-slate-900/50 backdrop-blur-sm m-4 border border-violet-500/20 transition-colors cursor-pointer">
                    <Hexagon className={cn("w-10 h-10 text-violet-400 mb-1 transition-all", isDragActive && "scale-110 text-violet-200")} />
                    <span className="text-violet-200 font-bold text-xl">{Math.round(progress)}%</span>
                </div>
            </div>
            <p className="mt-4 text-violet-300/60 font-mono text-xs uppercase tracking-widest">
                {activeFile ? activeFile.file.name.substring(0, 20) : "Awaiting Input"}
            </p>
        </div>
    );
};

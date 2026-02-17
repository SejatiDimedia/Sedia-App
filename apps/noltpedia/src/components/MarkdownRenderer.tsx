import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import Quiz from "./mdx/Quiz";
import Callout from "./mdx/Callout";
import Challenge from "./mdx/Challenge";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
    content: string;
}

// Language display names
const LANG_LABELS: Record<string, string> = {
    javascript: "JavaScript",
    js: "JavaScript",
    typescript: "TypeScript",
    ts: "TypeScript",
    jsx: "JSX",
    tsx: "TSX",
    html: "HTML",
    css: "CSS",
    json: "JSON",
    bash: "Bash",
    sh: "Shell",
    sql: "SQL",
    python: "Python",
    py: "Python",
    markdown: "Markdown",
    md: "Markdown",
    yaml: "YAML",
    yml: "YAML",
    diff: "Diff",
};

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback
            const textarea = document.createElement("textarea");
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <button
            onClick={handleCopy}
            className="hover:scale-105 active:scale-95"
            style={{
                background: copied ? "#22c55e" : "#374151",
                color: "#fff",
                border: "2px solid #000",
                boxShadow: copied ? "none" : "2px 2px 0px #000",
                padding: "2px 8px",
                fontSize: "10px",
                fontWeight: 900,
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                borderRadius: "2px",
                transition: "all 0.1s ease",
            }}
        >
            {copied ? "✓ Copied!" : "Copy"}
        </button>
    );
}

// Custom theme overrides for neobrutalist look
const neoCodeTheme = {
    ...oneDark,
    'pre[class*="language-"]': {
        ...oneDark['pre[class*="language-"]'],
        background: "#0d0d1a",
        margin: 0,
        padding: "1.25rem",
        fontSize: "0.875rem",
        lineHeight: "1.7",
        borderRadius: 0,
    },
    'code[class*="language-"]': {
        ...oneDark['code[class*="language-"]'],
        background: "none",
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
        fontSize: "0.875rem",
    },
};

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                code(props: any) {
                    const { children, className, node, ...rest } = props;
                    const match = /language-(\w+)/.exec(className || "");
                    const lang = match ? match[1] : "";
                    const codeString = String(children).replace(/\n$/, "");

                    // Interactive components
                    if (lang === "quiz") {
                        try {
                            const data = JSON.parse(codeString);
                            return <Quiz {...data} />;
                        } catch (e) {
                            return <div className="text-red-500 font-bold border-2 border-red-500 p-4">Error parsing Quiz JSON</div>;
                        }
                    }

                    if (lang === "callout") {
                        const text = codeString.trim();
                        const [header, ...bodyParts] = text.split("\n");
                        const body = bodyParts.join("\n");
                        const colonIndex = header.indexOf(":");
                        let type = "info";
                        let title = "";
                        if (colonIndex !== -1) {
                            type = header.substring(0, colonIndex).trim().toLowerCase();
                            title = header.substring(colonIndex + 1).trim();
                        } else {
                            type = header.trim().toLowerCase();
                        }
                        if (!["info", "warning", "tip", "success"].includes(type)) {
                            type = "info";
                        }
                        return (
                            <Callout type={type as any} title={title}>
                                {body}
                            </Callout>
                        );
                    }

                    if (lang === "challenge") {
                        try {
                            const data = JSON.parse(codeString);
                            return <Challenge {...data} />;
                        } catch (e) {
                            const text = codeString.trim();
                            const lines = text.split("\n");
                            const title = lines[0].replace("Title:", "").trim();
                            const steps = lines.slice(1).map(step => step.replace(/^- /, "").trim());
                            return <Challenge title={title} steps={steps} />;
                        }
                    }

                    // Syntax-highlighted code blocks (fenced: ```lang)
                    if (lang) {
                        const label = LANG_LABELS[lang] || lang.toUpperCase();
                        return (
                            <div
                                className="group relative"
                                style={{
                                    border: "3px solid #000",
                                    boxShadow: "6px 6px 0px #000",
                                    marginBottom: "2rem",
                                    marginTop: "1rem",
                                    overflow: "hidden",
                                    transition: "all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                                }}
                            >
                                {/* Header bar */}
                                <div style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    background: "#1a1a2e",
                                    borderBottom: "3px solid #000",
                                    padding: "6px 12px",
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <div style={{ display: "flex", gap: "4px" }}>
                                            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ff5f56", border: "1px solid #000" }} />
                                            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ffbd2e", border: "1px solid #000" }} />
                                            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#27c93f", border: "1px solid #000" }} />
                                        </div>
                                        <span style={{
                                            fontSize: "10px",
                                            fontWeight: 900,
                                            color: "#facc15",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.15em",
                                            padding: "4px 0",
                                        }}>
                                            {label}
                                        </span>
                                    </div>
                                    <CopyButton text={codeString} />
                                </div>
                                {/* Code */}
                                <SyntaxHighlighter
                                    style={neoCodeTheme}
                                    language={lang}
                                    PreTag="div"
                                    showLineNumbers={codeString.split("\n").length > 2}
                                    lineNumberStyle={{
                                        minWidth: "2.5em",
                                        paddingRight: "1.25em",
                                        color: "#4b5563",
                                        borderRight: "1px solid #334155",
                                        marginRight: "1em",
                                        fontStyle: "normal",
                                        userSelect: "none",
                                        textAlign: "right",
                                    }}
                                    wrapLines
                                >
                                    {codeString}
                                </SyntaxHighlighter>
                            </div>
                        );
                    }

                    // Inline code
                    return (
                        <code
                            style={{
                                background: "#fef08a", // Yellowish background for neobrutalist contrast
                                border: "1px solid #000",
                                borderRadius: "4px",
                                padding: "0.1em 0.4em",
                                fontSize: "0.9em",
                                fontWeight: 800,
                                color: "#000",
                                margin: "0 2px",
                                whiteSpace: "nowrap",
                                boxShadow: "2px 2px 0px #000",
                                fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                            }}
                            {...rest}
                        >
                            {children}
                        </code>
                    );
                },
                // Blockquote styling
                blockquote(props: any) {
                    return <div className="pl-4 border-l-4 border-zinc-300 italic text-zinc-600 my-4">{props.children}</div>;
                },
                // Enhanced pre to prevent double wrapping
                pre(props: any) {
                    return <>{props.children}</>;
                }
            }}
        >
            {content}
        </ReactMarkdown>
    );
}

import React from "react";
import ReactMarkdown from "react-markdown";
import Quiz from "./mdx/Quiz";
import Callout from "./mdx/Callout";
import Challenge from "./mdx/Challenge";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
    content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                code(props: any) {
                    const { children, className, node, ...rest } = props;
                    const match = /language-(\w+)/.exec(className || "");
                    const lang = match ? match[1] : "";

                    if (lang === "quiz") {
                        try {
                            const data = JSON.parse(String(children).replace(/\n$/, ""));
                            return <Quiz {...data} />;
                        } catch (e) {
                            return <div className="text-red-500 font-bold border-2 border-red-500 p-4">Error parsing Quiz JSON</div>;
                        }
                    }

                    if (lang === "callout") {
                        // Format: Type: Title \n Content
                        const text = String(children).trim();
                        const [header, ...bodyParts] = text.split("\n");
                        const body = bodyParts.join("\n");

                        // Parse "Type: Title"
                        const colonIndex = header.indexOf(":");
                        let type = "info";
                        let title = "";

                        if (colonIndex !== -1) {
                            type = header.substring(0, colonIndex).trim().toLowerCase();
                            title = header.substring(colonIndex + 1).trim();
                        } else {
                            type = header.trim().toLowerCase();
                        }

                        // Validate type
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
                            // Format: JSON for simplicity or custom parsing
                            const data = JSON.parse(String(children).replace(/\n$/, ""));
                            return <Challenge {...data} />;
                        } catch (e) {
                            // Fallback to simple parsing if not JSON
                            const text = String(children).trim();
                            const lines = text.split("\n");
                            const title = lines[0].replace("Title:", "").trim();
                            const steps = lines.slice(1).map(step => step.replace(/^- /, "").trim());

                            return <Challenge title={title} steps={steps} />;
                        }
                    }

                    return (
                        <code className={className} {...rest}>
                            {children}
                        </code>
                    );
                },
                // Custom blockquote to Callout transformation (optional shorthand)
                blockquote(props: any) {
                    return <div className="pl-4 border-l-4 border-zinc-300 italic text-zinc-600 my-4">{props.children}</div>;
                }
            }}
        >
            {content}
        </ReactMarkdown>
    );
}

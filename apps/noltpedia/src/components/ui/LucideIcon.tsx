import React from "react";
import * as LucideIcons from "lucide-react";
import type { LucideProps } from "lucide-react";

interface LucideIconProps extends LucideProps {
    name: string;
}

const LucideIcon = ({ name, ...props }: LucideIconProps) => {
    // Safety check for null/undefined/non-string name
    if (!name || typeof name !== 'string') {
        return <LucideIcons.HelpCircle {...props} />;
    }

    // Convert kebab-case or snake_case to PascalCase for Lucide
    const pascalName = name
        .split(/[-_]/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join("");

    const Icon = (LucideIcons as any)[pascalName] || (LucideIcons as any)[name] || LucideIcons.HelpCircle;

    return <Icon {...props} />;
};

export default LucideIcon;

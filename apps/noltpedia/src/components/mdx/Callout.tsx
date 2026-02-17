import React from 'react';
import { Info, AlertTriangle, CheckCircle, Lightbulb } from 'lucide-react';

export interface CalloutProps {
    type: 'info' | 'warning' | 'success' | 'tip';
    title?: string;
    children: React.ReactNode;
}

const icons = {
    info: Info,
    warning: AlertTriangle,
    success: CheckCircle,
    tip: Lightbulb,
};

const styles = {
    info: 'bg-blue-100 border-blue-600 text-blue-900',
    warning: 'bg-yellow-100 border-yellow-600 text-yellow-900',
    success: 'bg-green-100 border-green-600 text-green-900',
    tip: 'bg-purple-100 border-purple-600 text-purple-900',
};

const Callout: React.FC<CalloutProps> = ({ type = 'info', title, children }) => {
    const Icon = icons[type];
    const style = styles[type];

    return (
        <div className={`my-6 flex flex-col gap-2 rounded-none border-l-4 border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${style}`}>
            <div className="flex items-center gap-2 font-bold">
                <Icon className="h-5 w-5" />
                <span className="uppercase tracking-wide">{title || type}</span>
            </div>
            <div className="text-base leading-relaxed">
                {children}
            </div>
        </div>
    );
};

export default Callout;

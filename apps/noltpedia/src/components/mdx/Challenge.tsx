import React, { useState } from 'react';
import { Trophy, CheckSquare, Square } from 'lucide-react';

export interface ChallengeProps {
    title: string;
    steps: string[];
}

const Challenge: React.FC<ChallengeProps> = ({ title, steps }) => {
    const [completedSteps, setCompletedSteps] = useState<boolean[]>(new Array(steps.length).fill(false));

    const toggleStep = (index: number) => {
        const newSteps = [...completedSteps];
        newSteps[index] = !newSteps[index];
        setCompletedSteps(newSteps);
    };

    const allCompleted = completedSteps.every(Boolean);

    return (
        <div className="my-8 rounded-none border-2 border-black bg-orange-50 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="mb-4 flex items-center gap-3 border-b-2 border-black pb-2">
                <Trophy className={`h-8 w-8 ${allCompleted ? 'text-yellow-500 fill-yellow-500' : 'text-black'}`} />
                <h3 className="text-xl font-bold font-display uppercase tracking-tight">Challenge: {title}</h3>
            </div>

            <div className="space-y-3">
                {steps.map((step, index) => (
                    <div
                        key={index}
                        className={`flex cursor-pointer items-start gap-3 rounded-none border-2 border-transparent p-2 transition-all hover:bg-orange-100 ${completedSteps[index] ? 'opacity-50' : ''}`}
                        onClick={() => toggleStep(index)}
                    >
                        <div className="mt-1">
                            {completedSteps[index] ? (
                                <CheckSquare className="h-5 w-5 text-green-600" />
                            ) : (
                                <Square className="h-5 w-5 text-black" />
                            )}
                        </div>
                        <span className={`font-medium ${completedSteps[index] ? 'line-through' : ''}`}>{step}</span>
                    </div>
                ))}
            </div>

            {allCompleted && (
                <div className="mt-6 flex items-center justify-center rounded-none border-2 border-green-600 bg-green-100 p-3 font-bold text-green-800 animate-pulse">
                    🎉 Challenge Completed!
                </div>
            )}
        </div>
    );
};

export default Challenge;

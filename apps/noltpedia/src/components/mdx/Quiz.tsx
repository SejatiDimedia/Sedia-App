import React, { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

export interface QuizProps {
    question: string;
    options: string[];
    answer: number; // Index of the correct answer
}

const Quiz: React.FC<QuizProps> = ({ question, options, answer }) => {
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = () => {
        if (selectedOption !== null) {
            setIsSubmitted(true);
        }
    };

    const isCorrect = selectedOption === answer;

    return (
        <div className="my-8 rounded-none border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-sans">
            <h3 className="mb-4 text-xl font-bold font-display">{question}</h3>
            <div className="space-y-3">
                {options.map((option, index) => {
                    let optionClass = "flex w-full items-center justify-between rounded-none border-2 border-black p-3 text-left transition-all ";

                    if (isSubmitted) {
                        if (index === answer) {
                            optionClass += "bg-green-100 border-green-600";
                        } else if (selectedOption === index) {
                            optionClass += "bg-red-100 border-red-600";
                        } else {
                            optionClass += "bg-white opacity-50";
                        }
                    } else {
                        optionClass += selectedOption === index ? "bg-neutral-200" : "bg-white hover:bg-neutral-100";
                    }

                    return (
                        <button
                            key={index}
                            onClick={() => !isSubmitted && setSelectedOption(index)}
                            disabled={isSubmitted}
                            className={optionClass}
                        >
                            <span className="font-medium">{option}</span>
                            {isSubmitted && index === answer && <CheckCircle className="h-5 w-5 text-green-600" />}
                            {isSubmitted && selectedOption === index && index !== answer && <XCircle className="h-5 w-5 text-red-600" />}
                        </button>
                    );
                })}
            </div>

            {!isSubmitted ? (
                <button
                    onClick={handleSubmit}
                    disabled={selectedOption === null}
                    className="mt-6 w-full border-2 border-black bg-black py-2 font-bold text-white transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(128,128,128,1)] disabled:cursor-not-allowed disabled:bg-neutral-400 disabled:border-neutral-400 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                >
                    Submit Answer
                </button>
            ) : (
                <div className={`mt-4 border-2 border-black p-4 font-bold ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {isCorrect ? 'Correct! Well done.' : 'Incorrect. Try again next time!'}
                </div>
            )}
        </div>
    );
};

export default Quiz;

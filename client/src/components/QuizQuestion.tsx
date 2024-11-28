import React from 'react';
import { Button } from '../core-components/Button';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from '../core-components/Card';

interface QuizQuestionProps {
  question: string;
  answers: string[];
  onSubmit: (answer: string) => void;
}

export const QuizQuestion: React.FC<QuizQuestionProps> = ({
  question,
  answers,
  onSubmit,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Question</CardTitle>
      </CardHeader>
      <CardContent>
        <p className='mb-4 text-lg'>{question}</p>
        <div className='grid grid-cols-2 gap-4'>
          {answers.map((answer, index) => (
            <Button key={index} onClick={() => onSubmit(answer)}>
              {answer}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

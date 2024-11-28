import React, { useState } from 'react';
import { Button } from '../core-components/Button';
import { Input } from '../core-components/Input';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from '../core-components/Card';

interface JoinQuizFormProps {
  onJoin: (userName: string, quizId: string, isCreating: boolean) => void;
}

export const JoinQuizForm: React.FC<JoinQuizFormProps> = ({ onJoin }) => {
  const [userName, setUserName] = useState('');
  const [quizId, setQuizId] = useState('');
  const [isCreating, setIsCreating] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName && (isCreating || quizId)) {
      onJoin(userName, isCreating ? '' : quizId, isCreating);
    }
  };

  return (
    <div className='flex items-center justify-center min-h-screen bg-gray-100'>
      <Card className='w-full max-w-md'>
        <CardHeader>
          <CardTitle>
            {isCreating ? 'Create New Quiz' : 'Join Existing Quiz'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <Input
              label='Your Name'
              id='userName'
              placeholder='Enter your name'
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
            />
            {!isCreating && (
              <Input
                label='Quiz ID'
                id='quizId'
                placeholder='Enter quiz ID'
                value={quizId}
                onChange={(e) => setQuizId(e.target.value)}
                required
              />
            )}
            <Button type='submit' className='w-full'>
              {isCreating ? 'Create Quiz' : 'Join Quiz'}
            </Button>
            <Button
              type='button'
              variant='secondary'
              className='w-full'
              onClick={() => setIsCreating(!isCreating)}>
              {isCreating ? 'Join Existing Quiz' : 'Create New Quiz'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

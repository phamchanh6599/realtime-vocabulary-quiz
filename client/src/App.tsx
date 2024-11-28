import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { JoinQuizForm } from './components/JoinQuizForm';
import { QuizQuestion } from './components/QuizQuestion';
import { Leaderboard } from './components/Leaderboard';
import { Toast } from './core-components/Toast';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from './core-components/Card';
import { Progress } from './core-components/Progress';

interface User {
  id: string;
  name: string;
  score: number;
}

interface QuizState {
  currentQuestion: number;
  totalQuestions: number;
  leaderboard: User[];
}

const socket: Socket = io('http://localhost:3000');

export default function App() {
  const [userName, setUserName] = useState('');
  const [quizId, setQuizId] = useState('');
  const [joined, setJoined] = useState(false);
  const [question, setQuestion] = useState('');
  const [answers, setAnswers] = useState<string[]>([]);
  const [leaderboard, setLeaderboard] = useState<User[]>([]);
  const [quizState, setQuizState] = useState<QuizState | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  const [isQuizEnd, setIsQuizEnd] = useState(false);

  useEffect(() => {
    socket.on('userJoined', (user: User) => {
      setToast({ message: `${user.name} joined the quiz`, type: 'info' });
    });

    socket.on('leaderboardUpdate', (updatedLeaderboard: User[]) => {
      setLeaderboard(updatedLeaderboard);
    });

    socket.on(
      'newQuestion',
      (data: { question: string; answers: string[] }) => {
        setQuestion(data.question);
        setAnswers(data.answers);
      }
    );

    socket.on('quizEnded', (finalLeaderboard: User[]) => {
      setLeaderboard(finalLeaderboard);
      setToast({ message: 'Quiz ended!', type: 'info' });
      setQuestion('');
      setAnswers([]);
      setIsQuizEnd(true);
    });

    socket.on('quizCreated', (newQuizId: string) => {
      setQuizId(newQuizId);
      setToast({ message: `Quiz created! ID: ${newQuizId}`, type: 'success' });
    });

    socket.on('quizState', (state: QuizState) => {
      setQuizState(state);
      setLeaderboard(state.leaderboard);
    });

    return () => {
      socket.off('userJoined');
      socket.off('leaderboardUpdate');
      socket.off('newQuestion');
      socket.off('quizEnded');
      socket.off('quizCreated');
      socket.off('quizState');
    };
  }, []);

  useEffect(() => {
    if (joined) {
      socket.emit('requestQuestion', { quizId });
    }
  }, [joined, quizId]);

  const handleJoinQuiz = (
    userName: string,
    quizId: string,
    isCreating: boolean
  ) => {
    setUserName(userName);
    if (isCreating) {
      socket.emit('createQuiz', { userName });
    } else {
      setQuizId(quizId);
      socket.emit('joinQuiz', { quizId, userName });
    }
    setJoined(true);
  };

  const handleSubmitAnswer = (answer: string) => {
    socket.emit('submitAnswer', { quizId, answer });
  };

  if (!joined) {
    return <JoinQuizForm onJoin={handleJoinQuiz} />;
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-3xl font-bold mb-6'>Vocabulary Quiz</h1>
      <Card className='mb-6'>
        <CardHeader>
          <CardTitle>Quiz Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            <strong>Your Name:</strong> {userName}
          </p>
          <p>
            <strong>Quiz ID:</strong> {quizId}
          </p>
          {quizState && (
            <div className='mt-4'>
              <Progress
                value={
                  (quizState.currentQuestion / quizState.totalQuestions) * 100
                }
                className='mt-2'
              />
            </div>
          )}
        </CardContent>
      </Card>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
        {!isQuizEnd &&
          (question && answers.length > 0 ? (
            <QuizQuestion
              question={question}
              answers={answers}
              onSubmit={handleSubmitAnswer}
            />
          ) : (
            <div className='flex items-center justify-center h-full'>
              <p className='text-xl font-semibold'>
                Waiting for the next question...
              </p>
            </div>
          ))}
        <Leaderboard users={leaderboard} />
      </div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

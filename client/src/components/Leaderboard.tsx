import React from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from '../core-components/Card';

interface User {
  id: string;
  name: string;
  score: number;
}

interface LeaderboardProps {
  users: User[];
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ users }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Leaderboard</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className='space-y-2'>
          {users.map((user, index) => (
            <li key={user.id} className='flex justify-between items-center'>
              <span>
                {index + 1}. {user.name}
              </span>
              <span className='font-bold'>{user.score} points</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

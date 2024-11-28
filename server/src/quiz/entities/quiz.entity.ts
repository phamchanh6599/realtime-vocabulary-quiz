export class User {
  id: string;
  name: string;
  score: number;
}

export class QuizSession {
  id: string;
  users: User[];
}

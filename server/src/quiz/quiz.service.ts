import { Injectable } from '@nestjs/common';
import { QuizSession, User } from './entities/quiz.entity';

@Injectable()
export class QuizService {
  private quizSessions: Map<string, QuizSession> = new Map();

  createOrJoinSession(quizId: string, user: User): QuizSession {
    let session = this.quizSessions.get(quizId);

    if (!session) {
      session = { id: quizId, users: [] };
      this.quizSessions.set(quizId, session);
    }

    session.users.push(user);
    return session;
  }

  removeUserFromAllSessions(userId: string): void {
    this.quizSessions.forEach((session) => {
      const index = session.users.findIndex((u) => u.id === userId);
      if (index !== -1) {
        session.users.splice(index, 1);
      }
    });
  }

  updateUserScore(
    quizId: string,
    userId: string,
    increment: number,
  ): User | null {
    const session = this.quizSessions.get(quizId);
    if (session) {
      const user = session.users.find((u) => u.id === userId);
      if (user) {
        user.score += increment;
        return user;
      }
    }
    return null;
  }

  getLeaderboard(quizId: string): User[] {
    const session = this.quizSessions.get(quizId);
    if (session) {
      return session.users
        .sort((a, b) => b.score - a.score)
        .map(({ id, name, score }) => ({ id, name, score }));
    }
    return [];
  }
}

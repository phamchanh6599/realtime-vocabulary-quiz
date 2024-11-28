import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { QUESTIONS } from '../constants/questions';
interface User {
  id: string;
  name: string;
  score: number;
}

interface QuizSession {
  id: string;
  users: User[];
  currentQuestion: number;
  questions: { question: string; answers: string[]; correctAnswer: string }[];
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class QuizGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private quizSessions: Map<string, QuizSession> = new Map();

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.removeUserFromAllSessions(client.id);
  }

  @SubscribeMessage('createQuiz')
  handleCreateQuiz(client: Socket, payload: { userName: string }) {
    const { userName } = payload;
    const quizId = uuidv4();
    const session: QuizSession = {
      id: quizId,
      users: [],
      currentQuestion: 0,
      questions: QUESTIONS,
    };
    this.quizSessions.set(quizId, session);
    this.handleJoinQuiz(client, { quizId, userName });
    client.emit('quizCreated', quizId);
  }

  @SubscribeMessage('joinQuiz')
  handleJoinQuiz(
    client: Socket,
    payload: { quizId: string; userName: string },
  ) {
    const { quizId, userName } = payload;
    const session = this.quizSessions.get(quizId);

    if (!session) {
      client.emit('error', 'Quiz not found');
      return;
    }

    const user: User = { id: client.id, name: userName, score: 0 };
    session.users.push(user);

    client.join(quizId);
    this.server.to(quizId).emit('userJoined', user);
    this.updateLeaderboard(quizId);

    // Send the current quiz state to the new user
    this.sendQuizState(quizId, client);
  }

  @SubscribeMessage('requestQuestion')
  handleRequestQuestion(client: Socket, payload: { quizId: string }) {
    const { quizId } = payload;
    this.sendQuestion(quizId, client);
  }

  @SubscribeMessage('submitAnswer')
  handleSubmitAnswer(
    client: Socket,
    payload: { quizId: string; answer: string },
  ) {
    const { quizId, answer } = payload;
    const session = this.quizSessions.get(quizId);

    if (session) {
      const user = session.users.find((u) => u.id === client.id);
      if (user) {
        const currentQuestion = session.questions[session.currentQuestion];
        if (answer === currentQuestion.correctAnswer) {
          user.score += 10;
          this.updateLeaderboard(quizId);
        }

        // Move to the next question
        session.currentQuestion++;
        this.server.to(quizId).emit('questionUpdate', {
          currentQuestion: session.currentQuestion,
          totalQuestions: session.questions.length,
        });
        if (session.currentQuestion >= session.questions.length) {
          this.server.to(quizId).emit('quizEnded', this.getLeaderboard(quizId));
        } else {
          this.sendQuestionToAll(quizId);
        }
      }
    }
  }

  private sendQuizState(quizId: string, client: Socket) {
    const session = this.quizSessions.get(quizId);
    if (session) {
      const quizState = {
        currentQuestion: session.currentQuestion,
        totalQuestions: session.questions.length,
        leaderboard: this.getLeaderboard(quizId),
      };
      client.emit('quizState', quizState);
      this.sendQuestion(quizId, client);
    }
  }

  private sendQuestion(quizId: string, client: Socket) {
    const session = this.quizSessions.get(quizId);
    if (session) {
      if (session.currentQuestion < session.questions.length) {
        const currentQuestion = session.questions[session.currentQuestion];
        client.emit('newQuestion', {
          question: currentQuestion.question,
          answers: currentQuestion.answers,
        });
      } else {
        client.emit('quizEnded', this.getLeaderboard(quizId));
      }
    }
  }

  private sendQuestionToAll(quizId: string) {
    const session = this.quizSessions.get(quizId);
    if (session) {
      const currentQuestion = session.questions[session.currentQuestion];
      this.server.to(quizId).emit('newQuestion', {
        question: currentQuestion.question,
        answers: currentQuestion.answers,
      });
    }
  }

  private updateLeaderboard(quizId: string) {
    const leaderboard = this.getLeaderboard(quizId);
    this.server.to(quizId).emit('leaderboardUpdate', leaderboard);
  }

  private getLeaderboard(quizId: string): User[] {
    const session = this.quizSessions.get(quizId);
    if (session) {
      return session.users
        .sort((a, b) => b.score - a.score)
        .map(({ id, name, score }) => ({ id, name, score }));
    }
    return [];
  }

  private removeUserFromAllSessions(userId: string) {
    this.quizSessions.forEach((session, quizId) => {
      const index = session.users.findIndex((u) => u.id === userId);
      if (index !== -1) {
        session.users.splice(index, 1);
        this.updateLeaderboard(quizId);
      }
    });
  }
}

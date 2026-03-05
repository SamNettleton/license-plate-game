export type FeedbackType = 'success' | 'error' | 'info';

export interface GameFeedback {
  message: string;
  type: FeedbackType;
}

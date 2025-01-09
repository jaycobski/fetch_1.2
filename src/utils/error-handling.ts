export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public originalError?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = {
  handle(error: any) {
    console.error('Error:', error);

    if (error instanceof AppError) {
      toast.error(error.message);
      return;
    }

    // Handle Supabase errors
    if (error?.code?.startsWith('PGRST')) {
      toast.error('Database operation failed. Please try again.');
      return;
    }

    // Handle network errors
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      toast.error('Network error. Please check your connection.');
      return;
    }

    // Handle unknown errors
    toast.error('An unexpected error occurred. Please try again.');
  }
}; 
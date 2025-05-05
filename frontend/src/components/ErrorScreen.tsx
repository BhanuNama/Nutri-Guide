const ErrorScreen = ({ message }: { message: string }) => (
    <div className="flex items-center justify-center h-64">
      <p className="text-red-600 font-semibold">Error: {message}</p>
    </div>
  );
  export default ErrorScreen;
  
import type { AuthMessage } from './authConfig';

interface StatusMessageProps {
  message: AuthMessage;
}

function StatusMessage({ message }: StatusMessageProps) {
  return <div className={`status-message status-${message.type}`}>{message.text}</div>;
}

export default StatusMessage;

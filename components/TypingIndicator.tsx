/** Three bouncing dots shown while the assistant is thinking. */
export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 py-1">
      <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground" />
      <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground" />
      <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground" />
    </div>
  );
}

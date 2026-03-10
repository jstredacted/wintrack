export default function RollForwardPrompt({ count, onConfirm, onDismiss }) {
  return (
    <div className="border border-border rounded p-4 flex items-center justify-between gap-4 text-sm font-mono">
      <span className="text-muted-foreground">
        {count} unfinished win{count !== 1 ? 's' : ''} from yesterday — carry forward?
      </span>
      <div className="flex gap-2">
        <button onClick={onConfirm} className="text-foreground underline hover:opacity-70 active:opacity-50 transition-opacity duration-75">Yes</button>
        <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground active:opacity-70 transition-colors duration-75">Dismiss</button>
      </div>
    </div>
  );
}

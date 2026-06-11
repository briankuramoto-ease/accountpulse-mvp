import { ActionItem } from "@/data/mockData";

type ActionItemsPanelProps = {
  actionItems: ActionItem[];
};

export function ActionItemsPanel({ actionItems }: ActionItemsPanelProps) {
  return (
    <div className="panel p-5">
      <p className="section-title">Action Items</p>
      <h2 className="mt-1 text-xl font-semibold">Next best moves</h2>
      <div className="mt-5 space-y-3">
        {actionItems.length ? (
          actionItems.map((item) => (
            <div key={item.id} className="rounded-lg border border-ink/10 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-1 text-sm text-steel">
                    {item.owner} - due {item.dueDate}
                  </p>
                </div>
                <span className={priorityClass(item.priority)}>{item.priority}</span>
              </div>
              <p className="mt-3 text-xs font-medium uppercase tracking-[0.12em] text-steel">{item.status}</p>
            </div>
          ))
        ) : (
          <p className="rounded-lg bg-paper p-4 text-sm text-steel">No open account actions.</p>
        )}
      </div>
    </div>
  );
}

function priorityClass(priority: ActionItem["priority"]) {
  const tone =
    priority === "High"
      ? "bg-signal/10 text-signal border-signal/20"
      : priority === "Medium"
        ? "bg-amberline/10 text-amberline border-amberline/20"
        : "bg-moss/10 text-moss border-moss/20";

  return `shrink-0 rounded-md border px-2 py-1 text-xs font-semibold ${tone}`;
}

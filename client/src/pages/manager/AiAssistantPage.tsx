import { useState, type FormEvent } from "react";
import { Bot, Send, Sparkles, UserRound } from "lucide-react";
import toast from "react-hot-toast";
import { api, errorMessage } from "../../api/client";

interface AssistantAnswer {
  title: string;
  scope: string;
  summary: string;
  items: Array<{ heading: string; details: string }>;
  note: string | null;
}

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  answer?: AssistantAnswer;
  detail?: string;
}

const examples = [
  "What did the team work on last week?",
  "Generate a team summary highlighting completed work, recurring blockers, and workload imbalances.",
  "What are the main open blockers across all team members?",
  "Which reports across the team currently need review?",
];

export function AiAssistantPage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);

  async function send(event?: FormEvent) {
    event?.preventDefault();
    const question = message.trim();
    if (!question || sending) return;
    setMessages((current) => [...current, { role: "user", text: question }]);
    setMessage("");
    setSending(true);
    try {
      const history = messages.slice(-10).map(({ role, text }) => ({
        role,
        text,
      }));
      const { data } = await api.post("/ai/chat", {
        message: question,
        history,
      });
      const answer = data.answer as AssistantAnswer;
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: [
            answer.title,
            answer.scope,
            answer.summary,
            ...answer.items.map(
              (answerItem) =>
                `${answerItem.heading}: ${answerItem.details}`,
            ),
            answer.note,
          ]
            .filter(Boolean)
            .join("\n"),
          answer,
          detail: `${data.reportCount} non-draft reports covered · ${data.model}`,
        },
      ]);
    } catch (error) {
      const message = errorMessage(error);
      toast.error(message);
      setMessages((current) => [
        ...current,
        { role: "assistant", text: message },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="text-blue-600" />
          <h1 className="page-title">AI Manager Assistant</h1>
        </div>
        <p className="mt-1 text-slate-500">
          Ask questions grounded in submitted WeekFlow reports.
        </p>
      </div>
      <div className="card">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
              <Bot />
            </div>
            <div>
              <h2 className="font-semibold">Try a team question</h2>
              <p className="text-sm text-slate-500">
                Answers use report content only and may still require
                verification.
              </p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {examples.map((example) => (
              <button
                className="rounded-lg border p-3 text-left text-sm hover:border-blue-300 hover:bg-blue-50"
                disabled={sending}
                key={example}
                onClick={() => setMessage(example)}
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      {!!messages.length && (
        <div className="card max-h-[55vh] space-y-4 overflow-y-auto">
          {messages.map((item, index) => (
            <div
              className={`flex gap-3 ${item.role === "user" ? "justify-end" : "justify-start"}`}
              key={`${item.role}-${index}`}
            >
              {item.role === "assistant" && (
                <div className="mt-1 rounded-full bg-blue-100 p-2 text-blue-700">
                  <Bot size={18} />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-xl p-4 text-sm ${item.role === "user" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}
              >
                {item.answer ? (
                  <div>
                    <h2 className="font-semibold text-slate-900">
                      {item.answer.title}
                    </h2>
                    <p className="mt-1 text-xs font-medium text-blue-700">
                      {item.answer.scope}
                    </p>
                    <p className="mt-3 whitespace-pre-wrap">
                      {item.answer.summary}
                    </p>
                    {!!item.answer.items.length && (
                      <div className="mt-3 space-y-2">
                        {item.answer.items.map((answerItem, answerIndex) => (
                          <div
                            className="rounded-lg border border-slate-200 bg-white p-3"
                            key={`${answerItem.heading}-${answerIndex}`}
                          >
                            <p className="font-medium text-slate-900">
                              {answerItem.heading}
                            </p>
                            <p className="mt-1 whitespace-pre-wrap text-slate-600">
                              {answerItem.details}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                    {item.answer.note && (
                      <p className="mt-3 text-xs text-amber-700">
                        {item.answer.note}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{item.text}</p>
                )}
                {item.detail && (
                  <p className="mt-2 text-xs text-slate-400">{item.detail}</p>
                )}
              </div>
              {item.role === "user" && (
                <div className="mt-1 rounded-full bg-slate-200 p-2 text-slate-600">
                  <UserRound size={18} />
                </div>
              )}
            </div>
          ))}
          {sending && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Bot size={18} /> Analyzing team reports…
            </div>
          )}
        </div>
      )}
      <form className="card flex items-end gap-3" onSubmit={send}>
        <label className="flex-1">
          Ask about team reports
          <textarea
            maxLength={1000}
            rows={3}
            placeholder="Summarize this week's achievements…"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
        </label>
        <button
          className="btn-primary mb-0.5 gap-2"
          disabled={!message.trim() || sending}
          type="submit"
        >
          <Send size={17} /> Send
        </button>
      </form>
    </div>
  );
}

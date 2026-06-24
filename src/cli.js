// Minimal REPL to talk to the agent from the terminal — fastest way to verify
// Milestone 1 once your QWEN_API_KEY is in .env.  Run: npm run chat
import "dotenv/config";
import readline from "node:readline";
import { runAgent } from "./agent.js";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((r) => rl.question(q, r));

let messages = [];

console.log("RemitGuide CLI — type a message ('exit' to quit).\n");

while (true) {
  const text = (await ask("you> ")).trim();
  if (!text || text.toLowerCase() === "exit") break;

  messages.push({ role: "user", content: text });
  try {
    const out = await runAgent(messages);
    messages = out.messages;
    if (out.toolTrace.length) {
      for (const t of out.toolTrace) console.log(`  [tool] ${t.name}(${JSON.stringify(t.args)})`);
    }
    console.log(`\nRemitGuide> ${out.reply}\n`);
  } catch (err) {
    console.log(`\n[error] ${err.message}\n`);
  }
}

rl.close();

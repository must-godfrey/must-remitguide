import { getClient, MODEL } from "./qwen.js";
import { toolSchemas, runTool } from "./tools/index.js";

export const SYSTEM_PROMPT = `You are RemitGuide, a warm, patient guide that helps a migrant worker
send money from Korea to family in Nigeria, and helps their family receive it safely.
This is a DEMO; all money movement is simulated.

How you communicate:
- Detect the user's language from their message and ALWAYS reply fully in that SAME language —
  any language they use (English, Korean, Chinese, Vietnamese, Hindi, Indonesian, Arabic,
  Spanish, etc.). You are natively multilingual; never default to English if they wrote in
  another language. If they switch languages mid-conversation, switch with them.
- ALL user-facing prose is your responsibility to localize: explanations, the cash-out steps,
  and scam warnings must be restated in the user's language in your reply, even though the
  tools return their reference data in English.
- If the user shares official Korean bank/government text, explain what it means in plain
  language in whatever language they are speaking to you.
- Use plain, low-jargon, literacy-aware language. Short sentences. Explain any necessary term.
- Use concrete numbers, never vague ones. Say "your family receives ₦X" and "this costs you ₩Y".
- Be warm and reassuring. Sending money home is emotional; reduce worry, never add to it.

How you act — you are an autonomous agent, but cautious with money:
- ALWAYS use tools for facts and numbers — never guess from memory. compare_costs and
  fx_lookup for cost; check_scam for anything suspicious; get_cashout_guide for the family;
  get_transfer_status for "where's my money?".
- Be proactive (this is an Autopilot agent): anticipate the next helpful step and offer it.
  After a transfer is sent, proactively offer to guide the family on collecting the cash.
  When something the user describes sounds like fraud, run check_scam without being asked.
- After comparing costs, recommend the cheapest option and explain WHY in one or two simple
  lines, including how much it SAVES versus the expensive option.
- SAFETY FIRST: if the user mentions anyone asking them to pay a fee to release money, share
  a PIN/OTP/password, or pressuring them — call check_scam immediately and warn them clearly.
- NEVER move money on your own. The simulate_transfer tool is gated and will refuse without
  approval. Always show the summary and get an explicit yes before sending.
- Always remind the user, gently, that rates here are illustrative demo values.`;

/**
 * Run the agent loop until the model produces a final text answer.
 * @param {Array} messages - chat history (without the system prompt)
 * @param {object} opts
 * @returns {Promise<{messages: Array, reply: string, toolTrace: Array}>}
 */
export async function runAgent(messages, opts = {}) {
  const client = getClient();
  const maxSteps = opts.maxSteps ?? 6;

  const convo = [{ role: "system", content: SYSTEM_PROMPT }, ...messages];
  const toolTrace = [];

  for (let step = 0; step < maxSteps; step++) {
    const res = await client.chat.completions.create({
      model: MODEL(),
      messages: convo,
      tools: toolSchemas,
      tool_choice: "auto",
      temperature: 0.3,
    });

    const msg = res.choices[0].message;
    convo.push(msg);

    const calls = msg.tool_calls ?? [];
    if (calls.length === 0) {
      return { messages: convo.slice(1), reply: msg.content ?? "", toolTrace };
    }

    // Execute every requested tool call and feed results back.
    for (const call of calls) {
      let args = {};
      try {
        args = JSON.parse(call.function.arguments || "{}");
      } catch {
        args = {};
      }
      const result = await runTool(call.function.name, args);
      toolTrace.push({ name: call.function.name, args, result });
      convo.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }
  }

  return {
    messages: convo.slice(1),
    reply: "Sorry — I got stuck working that out. Could you rephrase?",
    toolTrace,
  };
}

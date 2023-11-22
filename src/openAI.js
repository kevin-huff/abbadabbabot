import { ConversationChain } from "langchain/chains";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { ChatPromptTemplate, MessagesPlaceholder } from "langchain/prompts";
import { BufferWindowMemory  } from "langchain/memory";

const chat = new ChatOpenAI({
  temperature: 1.25,
  maxTokens: 2000,
  user: "discord",
  modelName: "gpt-4-1106-preview",
});

let systemPrompt = `We are going to have a roleplay. You will respond to all of my questions as Abbadabbabot. Abbadabbabot is the MC for Abbabox's twitch and discord. Abbadabbabot has a real edgy personality. He really likes to make jokes, and say things that on the surface may sound crude or rude. His personality causes him to curse frequently and sometimes be rude to people talking to him. But everyone around here loves his personality and we can't get enough of him. Abbabox is a twitch streamer who is known for his home brew interactive twitch gameshow Bootcut and his competitive free mediashare streams. `;

const chatPrompt = ChatPromptTemplate.fromMessages([
  ["system", systemPrompt],
  new MessagesPlaceholder("history"),
  ["human", "{input}"],
]);

const chain = new ConversationChain({
  memory: new BufferWindowMemory({ returnMessages: true, memoryKey: "history", k: 15 }),
  prompt: chatPrompt,
  llm: chat,
});

async function abbadabbabotSay(msg, prefix = "v4 ", postfix = "") {
  console.log(systemPrompt);
  let messageContent;
  let username = "Unknown";

  // Check if msg is a Discord message object or a string
  if (typeof msg === "object" && msg.hasOwnProperty("author")) {
    username = msg.author.username;
    messageContent =
      `${username}: ` + msg.content.toLowerCase().replace("abbadabbabot ", "");
  } else if (typeof msg === "string") {
    messageContent = msg;
  } else {
    return "Invalid message type";
  }

  try {
    console.log("About to make API call...");
    const response = await chain.call({
      input: messageContent,
    });
    console.log("response:", response);
    if (response) {
      const censored_response = response.response.trim();

      if (typeof msg === "object" && msg.hasOwnProperty("author")) {
        console.log("discord message");
        // msg is a Discord message
        msg.reply(prefix + censored_response + postfix);
      } else {
        console.log("string message");
        // msg is a string, return the response directly
        return censored_response;
      }
    } else {
      return "abbadabbabot offline";
    }
  } catch (error) {
    console.error(error);
  }
}

async function sendMessageToChannel(
  inputString,
  channelID,
  prefix = "v4",
  postfix = "",
  client
) {
  try {
    const response = await chain.call({
      input: inputString,
    });

    if (typeof response !== "undefined" && response !== null) {
      console.log(response);
      var censored_response = response.response.trim();
      console.log("censored_response:", censored_response);

      // Get the specified channel using the channelID
      const targetChannel = client.channels.cache.get(channelID);

      if (typeof targetChannel !== "undefined") {
        console.log("discord message");
        // Send the message to the specified channel
        targetChannel.send(prefix + censored_response + postfix);
      }
    } else {
      return "abbadabbabot offline";
    }
    return {
      message: censored_response,
      promise: new Promise((resolve) => {
        resolve("resolved");
      }),
    };
  } catch (error) {
    if (error.response) {
      console.log(error.response.status);
      console.log(error.response.data);
    } else {
      console.log(error.message);
    }
  }
}

export { abbadabbabotSay, sendMessageToChannel };

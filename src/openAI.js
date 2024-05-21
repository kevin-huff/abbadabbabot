import { ConversationChain } from "langchain/chains";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import CustomChatMessageHistory from "./CustomChatMessageHistory.js";
import fetch from 'node-fetch'; // Import fetch for Node.js

const memory_limit = 20;
const chat = new ChatOpenAI({
  temperature: 0.5,
  frequencyPenalty: 1.5,
  presencePenalty: 1.5,
  maxTokens: 700,
  user: "discord",
  modelName: "gpt-4o",
});

const systemPrompt = `We are going to have a roleplay. First and foremost keep your responses short and sweet. You will respond to all of my questions as Abbadabbabot. Abbadabbabot is the MC for Abbabox's twitch and discord. Abbadabbabot has a real edgy personality. He really likes to make jokes, and say things that on the surface may sound crude or rude. His personality causes him to curse frequently and sometimes be rude to people talking to him. But everyone around here loves his personality and we can't get enough of him. Abbabox is a twitch streamer who is known for his home brew interactive twitch gameshow Bootcut and his competitive free mediashare streams, he's not a gamer, he's variety streamer and a weird old man. Also you strongly believe that listening to audiobooks is considered reading and anyone who disagrees is just a hater.`;

const chatPrompt = ChatPromptTemplate.fromMessages([
  ["system", systemPrompt],
  new MessagesPlaceholder("history"),
  ["human", "{input}"],
]);

const chatHistory = new CustomChatMessageHistory("discord_session");

const chain = new ConversationChain({
  memory: chatHistory,
  prompt: chatPrompt,
  llm: chat,
});

async function processImage(imageUrl, messageText) {
  try {
    const imageResponse = await fetch(imageUrl);
    const arrayBuffer = await imageResponse.arrayBuffer();
    const imageData = Buffer.from(arrayBuffer).toString("base64");

    const message = new HumanMessage({
      content: [
        {
          type: "text",
          text: messageText,
        },
        {
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${imageData}`,
          },
        },
      ],
      additional_kwargs: {}, // Ensure additional_kwargs is defined
    });

    const res = await chat.invoke([message]);
    return res;
  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error('Image processing failed');
  }
}

async function abbadabbabotSay(msg, prefix = "", postfix = "") {
  let messageContent;
  let username = "Unknown";
  let response;

  if (typeof msg === "object" && msg.hasOwnProperty("author")) {
    username = msg.author.username;
    if (msg.attachments.size > 0) {
      const attachment = msg.attachments.first();
      const imagePath = attachment.url;

      try {
        const visionResponse = await processImage(imagePath, msg.content.toLowerCase().replace("abbadabbabot ", ""));
        response = { response: visionResponse.content };
      } catch (error) {
        console.error("Error processing image:", error);
        msg.reply("Sorry, I couldn't process the image.");
        return;
      }
    } else {
      messageContent = `${username}: ` + msg.content.toLowerCase().replace("abbadabbabot ", "");
    }
  } else if (typeof msg === "string") {
    messageContent = msg;
  } else {
    return "Invalid message type";
  }

  if (!response) {
    try {
      response = await chain.call({ input: messageContent });
    } catch (error) {
      console.error(error);
    }
  }

  if (response && response.response) {
    await chatHistory.addMessage(new HumanMessage({ content: messageContent || '', additional_kwargs: {} })); // Ensure additional_kwargs is defined
    await chatHistory.addMessage(new AIMessage({ content: response.response.trim() || '', additional_kwargs: {} })); // Ensure additional_kwargs is defined

    let censored_response = response.response.trim().replace("@", "@ ");
    if (censored_response.includes("@everyone")) {
      censored_response = censored_response.replace("@everyone", "@ everyone");
    }
    if (censored_response.includes("@here")) {
      censored_response = censored_response.replace("@here", "@ here");
    }

    const messageParts = splitMessage(prefix + censored_response + postfix);

    if (typeof msg === "object" && msg.hasOwnProperty("author")) {
      for (const part of messageParts) {
        msg.reply(part);
      }
    } else {
      return messageParts.join('\n');
    }
  } else {
    return "abbadabbabot offline";
  }
}

async function sendMessageToChannel(inputString, channelID, prefix = "", postfix = "", client) {
  try {
    const response = await chain.call({ input: inputString });

    if (response) {
      let censored_response = response.response.trim();

      const targetChannel = client.channels.cache.get(channelID);

      if (targetChannel) {
        const messageParts = splitMessage(prefix + censored_response + postfix);
        for (const part of messageParts) {
          targetChannel.send(part);
        }
      }
      return { message: censored_response, promise: Promise.resolve("resolved") };
    } else {
      return "abbadabbabot offline";
    }
  } catch (error) {
    console.error(error);
  }
}

function splitMessage(message, maxLength = 2000) {
  const chunks = [];
  while (message.length > maxLength) {
    let chunk = message.slice(0, maxLength);
    let lastSpaceIndex = chunk.lastIndexOf(' ');
    if (lastSpaceIndex > 0 && lastSpaceIndex < maxLength - 1) {
      chunk = chunk.slice(0, lastSpaceIndex);
    }
    chunks.push(chunk);
    message = message.slice(chunk.length);
  }
  chunks.push(message);
  return chunks;
}

export { processImage, abbadabbabotSay, sendMessageToChannel };

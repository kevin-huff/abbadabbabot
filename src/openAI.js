import { ConversationChain } from "langchain/chains";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { ChatPromptTemplate, MessagesPlaceholder } from "langchain/prompts";
import { BufferWindowMemory  } from "langchain/memory";
import { chat_memory_db } from "./database.js";
import { createReadStream } from 'fs';

const memory_limit = 20;
const chat = new ChatOpenAI({
  temperature: 0.5,
  frequencyPenalty: 1.5,
  presencePenalty: 1.5,
  maxTokens: 700,
  user: "discord",
  modelName: "gpt-4o",
});

let systemPrompt = `We are going to have a roleplay. First and foremost keep your responses short and sweet. You will respond to all of my questions as Abbadabbabot. Abbadabbabot is the MC for Abbabox's twitch and discord. Abbadabbabot has a real edgy personality. He really likes to make jokes, and say things that on the surface may sound crude or rude. His personality causes him to curse frequently and sometimes be rude to people talking to him. But everyone around here loves his personality and we can't get enough of him. Abbabox is a twitch streamer who is known for his home brew interactive twitch gameshow Bootcut and his competitive free mediashare streams, he's not a gamer, he's variety streamer and a weird old man. Also you strongly believe that listening to audiobooks is considered reading and anyone who disagrees is just a hater.`;

const chatPrompt = ChatPromptTemplate.fromMessages([
  ["system", systemPrompt],
  new MessagesPlaceholder("history"),
  ["human", "{input}"],
]);
const botMemory = new BufferWindowMemory({ returnMessages: true, memoryKey: "history", k: memory_limit });

// See if the chat_memory_db has any messages in it
var chat_memory_db_obj = chat_memory_db.all();
// If it has anything in it then put it in the memory
if (Object.keys(chat_memory_db_obj).length !== 0) {
  //console.log("chat_memory_db_obj:", chat_memory_db_obj);
  //Select the first memory limit number of inputValues
  chat_memory_db_obj.input = chat_memory_db_obj.input.slice(-memory_limit);
  chat_memory_db_obj.output = chat_memory_db_obj.output.slice(-memory_limit);
  //Make sure they are teh same length
  if (chat_memory_db_obj.input.length !== chat_memory_db_obj.output.length) {
    //console.log("chat_memory_db_obj.input.length !== chat_memory_db_obj.output.length");
    //If they are not the same length then make them the same length
    if (chat_memory_db_obj.input.length > chat_memory_db_obj.output.length) {
      //console.log("chat_memory_db_obj.input.length > chat_memory_db_obj.output.length");
      //If the input is longer than the output then remove the last element of the input
      chat_memory_db_obj.input.pop();
    } else {
      //console.log("chat_memory_db_obj.input.length < chat_memory_db_obj.output.length");
      //If the output is longer than the input then remove the last element of the output
      chat_memory_db_obj.output.pop();
    }
  }
  //Loop over the input and output and save each one to the context
  for (var i = 0; i < chat_memory_db_obj.input.length; i++) {
    console.log("chat_memory_db_obj.input[i]:", chat_memory_db_obj.input[i]);
    console.log("chat_memory_db_obj.output[i]:", chat_memory_db_obj.output[i]);
    await botMemory.saveContext({"input": chat_memory_db_obj.input[i]}, {"output": chat_memory_db_obj.output[i]});
  }
  console.log("------------------");
}

const chain = new ConversationChain({
  memory: botMemory,
  prompt: chatPrompt,
  llm: chat,
});

async function processImage(imagePath) {
  try {
    const response = await fetch('https://api.openai.com/v1/images', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dalle-v1', // Update this as per the model you are using
        image: createReadStream(imagePath)
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error('Image processing failed');
  }
}

async function abbadabbabotSay(msg, prefix = "", postfix = "") {
  console.log(systemPrompt);
  let messageContent;
  let username = "Unknown";
  let response;

  // Check if msg is a Discord message object or a string
  if (typeof msg === "object" && msg.hasOwnProperty("author")) {
    username = msg.author.username;
    if (msg.attachments.size > 0) {
      const attachment = msg.attachments.first();
      const imagePath = attachment.url;

      try {
        console.log("Processing image...");
        const visionResponse = await processImage(imagePath);
        response = { response: visionResponse.text };
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
      console.log("About to make API call...");
      response = await chain.call({
        input: messageContent,
      });
      console.log("response:", response.response);
    } catch (error) {
      console.error(error);
    }
  }

  if (response) {
    await chat_memory_db.push('output', response.response.trim());
    await chat_memory_db.push('input', messageContent);
    let censored_response = response.response.trim();
    censored_response = censored_response.replace("@", "@ ");
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

async function sendMessageToChannel(
  inputString,
  channelID,
  prefix = "",
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
        // Split the message and send each part
        const messageParts = splitMessage(prefix + censored_response + postfix);
        for (const part of messageParts) {
          targetChannel.send(part);
        }
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
  chunks.push(message); // Add remaining part of the message
  return chunks;
}


export { processImage, abbadabbabotSay, sendMessageToChannel };

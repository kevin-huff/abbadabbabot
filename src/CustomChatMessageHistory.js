import { BaseListChatMessageHistory } from "@langchain/core/chat_history";
import {
  BaseMessage,
  mapChatMessagesToStoredMessages,
  mapStoredMessagesToChatMessages,
  HumanMessage,
  AIMessage,
} from "@langchain/core/messages";

class CustomChatMessageHistory extends BaseListChatMessageHistory {
  constructor(sessionId) {
    super();
    this.sessionId = sessionId;
    this.fakeDatabase = {}; // Simulate a real database layer. Stores serialized objects.
  }

  async getMessages() {
    const messages = this.fakeDatabase[this.sessionId] || [];
    return mapStoredMessagesToChatMessages(messages);
  }

  async addMessage(message) {
    if (!this.fakeDatabase[this.sessionId]) {
      this.fakeDatabase[this.sessionId] = [];
    }
    const serializedMessages = mapChatMessagesToStoredMessages([message]);
    this.fakeDatabase[this.sessionId].push(serializedMessages[0]);
  }

  async addMessages(messages) {
    if (!this.fakeDatabase[this.sessionId]) {
      this.fakeDatabase[this.sessionId] = [];
    }
    const existingMessages = this.fakeDatabase[this.sessionId];
    const serializedMessages = mapChatMessagesToStoredMessages(messages);
    this.fakeDatabase[this.sessionId] = existingMessages.concat(serializedMessages);
  }

  async clear() {
    delete this.fakeDatabase[this.sessionId];
  }

  async loadMemoryVariables() {
    const messages = await this.getMessages();
    return {
      history: messages,
    };
  }

  async saveContext(inputs, outputs) {
    const userMessage = new HumanMessage({
      content: inputs.input || '',
    });
    const aiMessage = new AIMessage({
      content: outputs.response || '',
    });
    await this.addMessages([userMessage, aiMessage]);
  }
}

export default CustomChatMessageHistory;

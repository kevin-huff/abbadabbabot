import { HumanMessage, AIMessage } from "@langchain/core/messages";

class CustomChatMessageHistory {
  constructor(sessionId, memoryLimit = 20) {
    this.sessionId = sessionId;
    this.memoryLimit = memoryLimit;
    this.messages = [];
  }

  async addMessage(message) {
    this.messages.push(message);
    if (this.messages.length > this.memoryLimit) {
      this.messages.shift(); // Remove the oldest message
    }
    this.logMemoryContext();
  }

  async getMessages() {
    return this.messages;
  }

  async clear() {
    this.messages = [];
    this.logMemoryContext();
  }

  async loadMemoryVariables() {
    return { history: this.messages };
  }

  async saveContext(_input, _output) {
    // No-op for this implementation
  }

  logMemoryContext() {
    console.log(`Current memory context size: ${this.messages.length} messages.`);
  }
}

export default CustomChatMessageHistory;

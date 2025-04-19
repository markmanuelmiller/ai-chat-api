"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIService = void 0;
const Message_1 = require("@/domain/entities/Message");
const MessageCreatedEvent_1 = require("@/domain/events/impl/MessageCreatedEvent");
class AIService {
    constructor(chatRepository, messageRepository, eventEmitter) {
        this.chatRepository = chatRepository;
        this.messageRepository = messageRepository;
        this.eventEmitter = eventEmitter;
    }
    // In a real implementation, this would integrate with LangChain and LangGraph
    async generateResponse(chatId, userMessage) {
        const chat = await this.chatRepository.findById(chatId);
        if (!chat) {
            throw new Error('Chat not found');
        }
        // Save the user message
        const userMessageEntity = Message_1.Message.create({
            chatId,
            role: Message_1.MessageRole.USER,
            content: userMessage,
        });
        await this.messageRepository.save(userMessageEntity);
        await this.eventEmitter.emit(new MessageCreatedEvent_1.MessageCreatedEvent(userMessageEntity.id, chatId, Message_1.MessageRole.USER, userMessageEntity.content));
        // Here we would integrate with LangChain/LangGraph
        // For now, just mock a response
        const mockResponse = `This is a mock AI response to: "${userMessage}"`;
        // Save the assistant message
        const assistantMessage = Message_1.Message.create({
            chatId,
            role: Message_1.MessageRole.ASSISTANT,
            content: mockResponse,
        });
        const savedMessage = await this.messageRepository.save(assistantMessage);
        await this.eventEmitter.emit(new MessageCreatedEvent_1.MessageCreatedEvent(savedMessage.id, chatId, Message_1.MessageRole.ASSISTANT, savedMessage.content));
        return savedMessage;
    }
    // This method would be used for streaming responses
    async streamResponse(chatId, userMessage) {
        const chat = await this.chatRepository.findById(chatId);
        if (!chat) {
            throw new Error('Chat not found');
        }
        // Save the user message
        const userMessageEntity = Message_1.Message.create({
            chatId,
            role: Message_1.MessageRole.USER,
            content: userMessage,
        });
        await this.messageRepository.save(userMessageEntity);
        await this.eventEmitter.emit(new MessageCreatedEvent_1.MessageCreatedEvent(userMessageEntity.id, chatId, Message_1.MessageRole.USER, userMessageEntity.content));
        // Store references to instance properties needed in the generator
        const messageRepository = this.messageRepository;
        const eventEmitter = this.eventEmitter;
        // Mock streaming for now
        // In a real implementation, this would stream from LangChain/LangGraph
        async function* mockStream() {
            const words = `This is a mock streaming AI response to: "${userMessage}"`.split(' ');
            let fullResponse = '';
            for (const word of words) {
                fullResponse += word + ' ';
                yield word + ' ';
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            // Save the full response
            const assistantMessage = Message_1.Message.create({
                chatId,
                role: Message_1.MessageRole.ASSISTANT,
                content: fullResponse.trim(),
            });
            await messageRepository.save(assistantMessage);
            await eventEmitter.emit(new MessageCreatedEvent_1.MessageCreatedEvent(assistantMessage.id, chatId, Message_1.MessageRole.ASSISTANT, assistantMessage.content));
        }
        return mockStream();
    }
}
exports.AIService = AIService;
//# sourceMappingURL=AIService.js.map
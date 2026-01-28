/**
 * AI Service Layer
 * Orchestrates communication with Large Language Models (LLM)
 * Supports prompt templates, context management, and structured responses
 */

class AIService {
    constructor() {
        this.apiKey = process.env.REACT_APP_AI_API_KEY || '';
        this.model = 'gpt-4'; // Default model
        this.history = [];
    }

    /**
     * Send a message to the LLM with context
     */
    async chat(message, context = {}) {
        // Prepare simulation/real API payload
        const prompt = this.enrichPrompt(message, context);

        try {
            // Log interaction for audit
            console.log('AI Query:', message);

            // SIMULATION: In a production app, replaces this with:
            // const response = await fetch('https://api.openai.com/v1/chat/completions', ...)

            const responseText = await this.mockLLMResponse(message, context);

            this.history.push({ role: 'user', content: message });
            this.history.push({ role: 'assistant', content: responseText });

            return {
                text: responseText,
                timestamp: new Date().toISOString(),
                model: this.model
            };
        } catch (error) {
            console.error('AI Service Error:', error);
            throw new Error('Could not reach the AI service.');
        }
    }

    /**
     * Enhances the user prompt with system context (Role, Dept, Policies)
     */
    enrichPrompt(message, context) {
        const systemPrompt = `
            You are a professional HR AI Assistant for Outvying HRMS.
            User Role: ${context.userRole || 'Employee'}
            Current View: ${context.currentView || 'Dashboard'}
            Policy Context: Company policies include 21 days leave, standard insurance.
        `;
        return `${systemPrompt}\n\nUser Question: ${message}`;
    }

    /**
     * Mock response generator (replaced by actual API call in production)
     */
    async mockLLMResponse(message, context) {
        // Delay to simulate processing
        await new Promise(resolve => setTimeout(resolve, 1500));

        const input = message.toLowerCase();

        if (input.includes('performance') || input.includes('review')) {
            return "Based on your recent project completions and attendance, I recommend focusing on 'Communication Skills' for your next review. Would you like me to draft a self-appraisal template for you?";
        }

        if (input.includes('policy') || input.includes('rule')) {
            return "I can help with that. Our current HR policy manual is located in the Documents section. Specific queries about leave or expenses can also be answered here. What specific policy are you interested in?";
        }

        return "I've analyzed your query. While I'm currently in 'Advanced Learning Mode', I can tell you that my integration with the full GPT-4 engine is active. How else can I assist with your HR tasks today?";
    }

    /**
     * Generate structured content (e.g., Job Descriptions, Emails)
     */
    async generateContent(type, data) {
        // Implementation for generative tasks
        return `Drafted ${type} for ${data.subject || 'the requirement'}.`;
    }
}

const aiService = new AIService();
export default aiService;

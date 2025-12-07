import "server-only"
import { GoogleGenerativeAI } from "@google/generative-ai"

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set")
}

// Initialize Gemini client - the SDK should automatically use v1 API
// Model names should be without -latest suffix for REST API compatibility
export const geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Extract retry delay from error message if available
 */
function extractRetryDelay(errorMessage: string): number | null {
  const retryMatch = errorMessage.match(/Please retry in ([\d.]+)s/)
  if (retryMatch) {
    const seconds = parseFloat(retryMatch[1])
    return Math.ceil(seconds * 1000) // Convert to milliseconds
  }
  return null
}

/**
 * Generate a response from Gemini based on user input and agent instructions
 * @param userInput - The user's input/question
 * @param instructions - The agent's system instructions/personality
 * @returns The generated response text
 */
export async function generateGeminiResponse(
  userInput: string,
  instructions: string
): Promise<string> {
  // Use fallback model names (listModels is not available in the SDK)
  const fallbackModels = [
    "gemini-1.5-flash",
    "gemini-1.5-pro", 
    "gemini-pro"
  ]
  const modelName = fallbackModels[0]

    const model = geminiClient.getGenerativeModel({ 
    model: modelName,
    })

    const prompt = `${instructions}\n\nUser: ${userInput}\n\nAssistant:`

  let lastError: unknown
  const maxRetries = 3
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()
    return text
  } catch (error) {
      lastError = error
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      // If it's a 404, try alternative models
      if ((errorMessage.includes('404') || errorMessage.includes('not found')) && attempt === 0) {
        // Try hardcoded alternatives
        const alternativeModels = [
          "gemini-1.5-flash",
          "gemini-1.5-pro",
          "gemini-pro",
          "models/gemini-1.5-flash",
          "models/gemini-1.5-pro",
          "models/gemini-pro"
        ]
        for (const altModel of alternativeModels) {
          if (altModel !== modelName) {
            try {
              const altModelInstance = geminiClient.getGenerativeModel({ model: altModel })
              const result = await altModelInstance.generateContent(prompt)
              const response = result.response
              const text = response.text()
              if (text && text.trim()) {
                return text
              }
            } catch {
              // Continue to next alternative
              continue
            }
          }
        }
      }
      
      // Check if it's a rate limit error (429)
      if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
        const retryDelay = extractRetryDelay(errorMessage) || (attempt + 1) * 2000 // Exponential backoff
        
        if (attempt < maxRetries - 1) {
          await sleep(retryDelay)
          continue
        }
      }
      
      // If not a rate limit error or max retries reached, throw immediately
    throw error
  }
  }
  
  throw lastError
}

/**
 * Generate a response using chat history for context
 * @param messages - Array of chat messages with role and content
 * @param instructions - The agent's system instructions
 * @returns The generated response text
 */
export async function generateGeminiChatResponse(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  instructions: string
): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set")
  }

  if (messages.length === 0) {
    throw new Error("No messages provided")
  }

  // Get the last user message
  const lastMessage = messages[messages.length - 1]
  if (lastMessage.role !== "user") {
    throw new Error("Last message must be from user")
  }

  // Use fallback model names (listModels is not available in the SDK)
  const fallbackModels = [
    "gemini-1.5-flash",
    "gemini-1.5-pro", 
    "gemini-pro"
  ]
  const modelName = fallbackModels[0]

    const model = geminiClient.getGenerativeModel({ 
    model: modelName,
    })

  let lastError: unknown
  const maxRetries = 3

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
    // Build chat history - convert messages to Gemini format
    const history = messages.slice(0, -1).map(msg => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }))

    // Start chat with instructions and history
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: instructions }],
        },
        {
          role: "model",
          parts: [{ text: "Understood. I am ready to assist." }],
        },
        ...history,
      ],
      generationConfig: {
        maxOutputTokens: 2000,
        temperature: 0.7,
      },
    })

      const result = await chat.sendMessage(lastMessage.content)
      const response = await result.response
      
      // Check if response has text
      if (!response) {
        throw new Error("No response received from Gemini API")
      }
      
    const text = response.text()
      
      if (!text || text.trim().length === 0) {
        throw new Error("Empty response received from Gemini API")
      }

    return text
  } catch (error) {
      lastError = error
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      // If it's a 404, try alternative models
      if ((errorMessage.includes('404') || errorMessage.includes('not found')) && attempt === 0) {
        // Try hardcoded alternatives
        const alternativeModels = [
          "gemini-1.5-flash",
          "gemini-1.5-pro",
          "gemini-pro",
          "models/gemini-1.5-flash",
          "models/gemini-1.5-pro",
          "models/gemini-pro"
        ]
        for (const altModel of alternativeModels) {
          if (altModel !== modelName) {
            try {
              const altModelInstance = geminiClient.getGenerativeModel({ model: altModel })
              
              // Rebuild chat with alternative model
              const history = messages.slice(0, -1).map(msg => ({
                role: msg.role === "user" ? "user" : "model",
                parts: [{ text: msg.content }],
              }))
              
              const altChat = altModelInstance.startChat({
                history: [
                  {
                    role: "user",
                    parts: [{ text: instructions }],
                  },
                  {
                    role: "model",
                    parts: [{ text: "Understood. I am ready to assist." }],
                  },
                  ...history,
                ],
                generationConfig: {
                  maxOutputTokens: 2000,
                  temperature: 0.7,
                },
              })
              
              const result = await altChat.sendMessage(lastMessage.content)
              const response = result.response
              const text = response.text()
              
              if (text && text.trim().length > 0) {
                return text
              }
            } catch {
              // Continue to next alternative
              continue
            }
          }
        }
      }
      
      // Check if it's a rate limit error (429)
      if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
        const retryDelay = extractRetryDelay(errorMessage) || (attempt + 1) * 2000 // Exponential backoff
        
        if (attempt < maxRetries - 1) {
          await sleep(retryDelay)
          continue
        }
      }
      
      // If not a rate limit error or max retries reached, log and throw
    console.error("Error generating Gemini chat response:", error)
      
      // If it's the last attempt or not a rate limit error, throw immediately
      if (attempt === maxRetries - 1 || !errorMessage.includes('429')) {
    throw error
      }
  }
  }
  
  throw lastError
}


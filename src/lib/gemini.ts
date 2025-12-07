import "server-only"
import { GoogleGenerativeAI } from "@google/generative-ai"

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set")
}

// Initialize Gemini client - the SDK should automatically use v1 API
// Model names should be without -latest suffix for REST API compatibility
export const geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

/**
 * Get available models - helper function to list models
 */
export async function listAvailableModels() {
  try {
    const models = await geminiClient.listModels()
    return models
  } catch (error) {
    console.error("Error listing models:", error)
    return null
  }
}

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
  // Try to get available models first, then use the first available one
  let modelName: string | undefined = undefined
  
  try {
    const modelsResponse = await geminiClient.listModels()
    
    // Handle different response formats
    const modelsList = modelsResponse.models || (modelsResponse as any)?.data?.models || []
    
    if (modelsList && modelsList.length > 0) {
      // Find models that support generateContent - check various possible method names
      const availableModels = modelsList
        .filter((m: any) => {
          const methods = m.supportedGenerationMethods || m.supportedMethods || []
          const supportsGenerate = 
            methods.includes('generateContent') || 
            methods.includes('GENERATE_CONTENT') ||
            methods.includes('generate-content') ||
            (Array.isArray(methods) && methods.length > 0) // If methods exist, assume it works
          return m.name && supportsGenerate
        })
        .map((m: any) => {
          // Use the exact name from the API response
          const name = m.name || ''
          // Return both with and without "models/" prefix for flexibility
          return {
            full: name,
            short: name.replace(/^models\//, '')
          }
        })
        .filter((m: any) => m.full)
      
      if (availableModels.length > 0) {
        // Prefer newer models (1.5 or flash), but use any available
        const preferred = availableModels.find((m: any) => 
          m.full.includes('1.5') || m.full.includes('flash') || m.short.includes('1.5') || m.short.includes('flash')
        ) || availableModels.find((m: any) => 
          m.full.includes('pro') || m.short.includes('pro')
        ) || availableModels[0]
        
        // Try the short name first, then the full name
        modelName = preferred.short || preferred.full
      }
    }
  } catch (error) {
    console.error("Error listing models (generateGeminiResponse):", error)
    // Continue without setting modelName, will use fallback
  }
  
  // Fallback to common model names if listing failed
  if (!modelName) {
    // Use correct model names for REST API (without -latest suffix)
    const fallbackModels = [
      "gemini-1.5-flash",
      "gemini-1.5-pro", 
      "gemini-pro"
    ]
    modelName = fallbackModels[0] // Start with first fallback
  }

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
      
      // If it's a 404, try to list models and use the first available one
      if ((errorMessage.includes('404') || errorMessage.includes('not found')) && attempt === 0) {
        try {
          const modelsResponse = await geminiClient.listModels()
          const modelsList = modelsResponse.models || (modelsResponse as any)?.data?.models || []
          
          if (modelsList && modelsList.length > 0) {
            // Try each available model
            for (const modelInfo of modelsList) {
              const modelFullName = modelInfo.name || ''
              const modelShortName = modelFullName.replace(/^models\//, '')
              
              // Try both full name and short name
              for (const tryName of [modelShortName, modelFullName]) {
                if (tryName && tryName !== modelName) {
                  try {
                    const altModelInstance = geminiClient.getGenerativeModel({ model: tryName })
                    const result = await altModelInstance.generateContent(prompt)
                    const response = result.response
                    const text = response.text()
                    if (text && text.trim()) {
                      return text
                    }
                  } catch (altError) {
                    // Continue to next model
                    continue
                  }
                }
              }
            }
          }
        } catch (listError) {
          console.error("Error listing models during 404 recovery:", listError)
        }
        
        // If listModels didn't help, try hardcoded alternatives
        const alternativeModels = [
          "gemini-1.5-flash",
          "gemini-1.5-pro",
          "models/gemini-1.5-flash",
          "models/gemini-1.5-pro"
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
            } catch (altError) {
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

  // Try to get available models first, then use the first available one
  let modelName: string | undefined = undefined
  
  try {
    const modelsResponse = await geminiClient.listModels()
    
    // Handle different response formats
    const modelsList = modelsResponse.models || (modelsResponse as any)?.data?.models || []
    
    if (modelsList && modelsList.length > 0) {
      // Find models that support generateContent - check various possible method names
      const availableModels = modelsList
        .filter((m: any) => {
          const methods = m.supportedGenerationMethods || m.supportedMethods || []
          const supportsGenerate = 
            methods.includes('generateContent') || 
            methods.includes('GENERATE_CONTENT') ||
            methods.includes('generate-content') ||
            (Array.isArray(methods) && methods.length > 0) // If methods exist, assume it works
          return m.name && supportsGenerate
        })
        .map((m: any) => {
          // Use the exact name from the API response
          const name = m.name || ''
          // Return both with and without "models/" prefix for flexibility
          return {
            full: name,
            short: name.replace(/^models\//, '')
          }
        })
        .filter((m: any) => m.full)
      
      if (availableModels.length > 0) {
        // Prefer newer models (1.5 or flash), but use any available
        const preferred = availableModels.find((m: any) => 
          m.full.includes('1.5') || m.full.includes('flash') || m.short.includes('1.5') || m.short.includes('flash')
        ) || availableModels.find((m: any) => 
          m.full.includes('pro') || m.short.includes('pro')
        ) || availableModels[0]
        
        // Try the short name first, then the full name
        modelName = preferred.short || preferred.full
      }
    }
  } catch (error) {
    console.error("Error listing models (generateGeminiChatResponse):", error)
    // Continue without setting modelName, will use fallback
  }
  
  // Fallback to common model names if listing failed
  if (!modelName) {
    // Use correct model names for REST API (without -latest suffix)
    const fallbackModels = [
      "gemini-1.5-flash",
      "gemini-1.5-pro", 
      "gemini-pro"
    ]
    modelName = fallbackModels[0] // Start with first fallback
  }

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
      
      // If it's a 404, try to list models and use the first available one
      if ((errorMessage.includes('404') || errorMessage.includes('not found')) && attempt === 0) {
        try {
          const modelsResponse = await geminiClient.listModels()
          const modelsList = modelsResponse.models || (modelsResponse as any)?.data?.models || []
          
          if (modelsList && modelsList.length > 0) {
            // Try each available model
            for (const modelInfo of modelsList) {
              const modelFullName = modelInfo.name || ''
              const modelShortName = modelFullName.replace(/^models\//, '')
              
              // Try both full name and short name
              for (const tryName of [modelShortName, modelFullName]) {
                if (tryName && tryName !== modelName) {
                  try {
                    const altModelInstance = geminiClient.getGenerativeModel({ model: tryName })
                    
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
                  } catch (altError) {
                    // Continue to next model
                    continue
                  }
                }
              }
            }
          }
        } catch (listError) {
          console.error("Error listing models during 404 recovery:", listError)
        }
        
        // If listModels didn't help, try hardcoded alternatives (correct REST API names)
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
            } catch (altError) {
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


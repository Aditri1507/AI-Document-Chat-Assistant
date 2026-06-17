import Document from "../models/Document.js";
import Chat from "../models/Chat.js";
import ai from "../services/geminiService.js";

function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return (
    dot /
    (Math.sqrt(normA) * Math.sqrt(normB))
  );
}
export const getChatById = async (
  req,
  res
) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    res.status(200).json({
      success: true,
      chat,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getChatHistory = async (
  req,
  res
) => {
  try {
    const chats = await Chat.find({
      userId: req.user.id,
    })
      .select("title updatedAt")
      .sort({
        updatedAt: -1,
      });

    res.status(200).json({
      success: true,
      chats,
    });
  } catch (error) {
    console.error(
      "History Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const askQuestion = async (
  req,
  res
) => {
  try {
    const {
      question,
      chatId,
      documentId,
    } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        message:
          "Question is required",
      });
    }

    const document =
      await Document.findOne({
        _id: documentId,
        user: req.user.id,
      });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    const embeddingResponse =
      await ai.models.embedContent({
        model: "gemini-embedding-2",
        contents: question,
      });

    const questionEmbedding =
      embeddingResponse.embeddings[0]
        .values;

    const scoredChunks = [];

    for (const chunk of document.chunks) {
      if (
        !chunk.embedding ||
        chunk.embedding.length === 0
      ) {
        continue;
      }

      const score =
        cosineSimilarity(
          questionEmbedding,
          chunk.embedding
        );

      scoredChunks.push({
        text: chunk.text,
        score,
      });
    }

    scoredChunks.sort(
      (a, b) => b.score - a.score
    );

    const topChunks =
      scoredChunks.slice(0, 5);

    const context = topChunks
      .map((chunk) => chunk.text)
      .join("\n\n");

    const prompt = `
Answer the question ONLY from the provided context.

Context:
${context}

Question:
${question}
`;

    const response =
      await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

    const answer =
      response.text ||
      "No answer generated";

    let chat;

    if (chatId) {
      chat =
        await Chat.findById(
          chatId
        );

      if (!chat) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Chat not found",
          });
      }
    } else {
      chat = await Chat.create({
        userId: req.user.id,
        title: question,
        messages: [],
      });
    }

    chat.messages.push({
      role: "user",
      content: question,
    });

    chat.messages.push({
      role: "assistant",
      content: answer,
    });

    await chat.save();

    res.status(200).json({
      success: true,
      answer,
      chatId: chat._id,
    });

  } catch (error) {
    console.error(
      "Chat Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

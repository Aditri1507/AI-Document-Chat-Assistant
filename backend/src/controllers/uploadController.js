import fs from "fs";
import path from "path";
import crypto from "crypto";
import mammoth from "mammoth";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import Document from "../models/Document.js";
import ai from "../services/geminiService.js";

export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const filePath = req.file.path;

    const fileBuffer = fs.readFileSync(filePath);

    const fileHash = crypto
      .createHash("sha256")
      .update(fileBuffer)
      .digest("hex");

    console.log("File Hash:", fileHash);
    console.log("Looking up hash:", fileHash);

    const existingDoc = await Document.findOne({
      user: req.user.id,
      fileHash,
    });

    console.log(
      "Existing doc:",
      existingDoc ? "FOUND" : "NOT FOUND"
    );

    if (existingDoc) {
      console.log("RETURNING CACHED DOCUMENT");

      return res.status(200).json({
        success: true,
        message: "Document loaded from database",
        _id: existingDoc._id,
        fileName: existingDoc.fileName,
        chunkCount: existingDoc.chunks.length,
        cached: true,
      });
    }

    const extension = path
      .extname(req.file.originalname)
      .toLowerCase();

    let extractedText = "";

    if (extension === ".pdf") {
      const loader = new PDFLoader(filePath);

      const docs = await loader.load();

      extractedText = docs
        .map((doc) => doc.pageContent)
        .join("\n");
    }

    else if (extension === ".txt") {
      extractedText = fs.readFileSync(
        filePath,
        "utf-8"
      );
    }

    else if (extension === ".docx") {
      const result = await mammoth.extractRawText({
        path: filePath,
      });

      extractedText = result.value;
    }

    else {
      return res.status(400).json({
        success: false,
        message:
          "Only PDF, TXT and DOCX files are supported",
      });
    }

    const splitter =
      new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });

    const chunks = await splitter.splitText(
      extractedText
    );

    const chunkObjects = [];

    for (const chunk of chunks) {
    const embeddingResponse =
        await ai.models.embedContent({
        model: "gemini-embedding-2",
        contents: chunk,
        });

    chunkObjects.push({
        text: chunk,
        embedding:
        embeddingResponse.embeddings[0].values,
    });
    }

    const document = await Document.create({
      user: req.user.id,
      fileName: req.file.originalname,
      fileHash,
      chunks: chunkObjects,
    });

    res.status(200).json({
      success: true,
      message:
        "Document uploaded successfully",
      _id: document._id,
      fileName: document.fileName,
      chunkCount: chunks.length,
      cached: false,
    });

  } catch (error) {
    console.error(
      "Upload Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

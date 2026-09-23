export const APP_NAME = "Insight GPT";
export const APP_DESCRIPTION = "Chat with your PDFs. Answers grounded in your documents.";
export const ASSISTANT_NAME = "Selene";

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
export const MAX_TRANSCRIPT_MESSAGES = 12;
export const MAX_MESSAGE_CHARS = 4_000;
export const ACCEPTED_MIME_TYPES = ["application/pdf"] as const;
export const STARTER_PROMPTS = [
  "Summarize this document",
  "What are the key takeaways?",
  "List any action items or deadlines",
  "Explain the most complex part simply",
];



export const TEXT_WELCOME_BACK = "Welcome Back";
export const TEXT_DESCRIPTION = "Insight GPT is your professional pdf analyzer, helping you learn faster and smarter.";
export const TEXT_ATLAS_ID_DESCRIPTION = "Atlas ID is your unified identity across all Atlas services";
export const TEXT_SIGN_IN_WITH_ATLAS_ID = "Sign in with Atlas ID";
export const TEXT_OR = "or";
export const TEXT_AND = "and";
export const TEXT_CONTINUE_AS_GUEST = "Continue as Guest";
export const TEXT_BY_CONTINUING = "By continuing, you agree to our";
export const TEXT_TERMS = "Terms of Service";
export const TEXT_PRIVACY = "Privacy Policy";
export const TEXT_COPYRIGHT = "2026 Insight GPT. All rights reserved.";
/** Shown when a PDF has no extractable text (scanned, or text converted to outlines). */
export const NO_TEXT_IN_PDF_MESSAGE =
  "This PDF has no selectable text. It may be scanned, or its text may have been converted to shapes. Try a PDF where you can highlight the text.";

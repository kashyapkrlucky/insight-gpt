
export class OpenAIResponseError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "OpenAIResponseError";
  }
}

export class ChatRequestParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChatRequestParseError";
  }
}

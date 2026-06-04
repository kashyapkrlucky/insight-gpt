export type OpenAIInputText = {
  readonly type: "input_text";
  readonly text: string;
};

export type OpenAIInputFile = {
  readonly type: "input_file";
  readonly filename: string;
  readonly file_data: string;
};

export type OpenAIInputImage = {
  readonly type: "input_image";
  readonly image_url: string;
  readonly detail: "auto";
};

export type OpenAIResponsesMessage = {
  readonly role: "assistant" | "user";
  readonly content: readonly (OpenAIInputText | OpenAIInputFile | OpenAIInputImage)[];
};

export type OpenAIResponsesRequest = {
  readonly model: string;
  readonly temperature: number;
  readonly input: readonly OpenAIResponsesMessage[];
};

export type OpenAIResponsesOutputText = {
  readonly type: "output_text";
  readonly text: string;
};

export type OpenAIResponsesOutputMessage = {
  readonly type: "message";
  readonly content?: readonly OpenAIResponsesOutputText[];
};

export type OpenAIResponsesSuccess = {
  readonly output?: readonly OpenAIResponsesOutputMessage[];
  readonly output_text?: string;
};

export type OpenAIResponsesFailure = {
  readonly error?: {
    readonly message?: string;
  };
};
